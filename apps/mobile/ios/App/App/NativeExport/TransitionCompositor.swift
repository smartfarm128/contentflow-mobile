import AVFoundation
import CoreImage
import Foundation
import ImageIO

/// kneecap M9 — the custom `AVVideoCompositing` implementation (plan M9
/// item 2, and plan §5 risk #4: "Build the transition compositor FIRST in
/// M9, not last"). Apple's own extension point for exactly this
/// (`AVCustomEdit` sample code — see corpus `07-ios-webview.md` §8), used
/// here for two things:
///   1. Cross-fading between two overlapping main-track clips during a
///      transition window (`EdlVideoCompositionInstruction.secondaryTrackID
///      != kCMPersistentTrackID_Invalid`).
///   2. A minimal per-clip effect pass — v1 wires exactly one effect type,
///      `"brightness"` (matching the one effect present in the frozen EDL
///      v1 golden fixture, `edl/__tests__/golden-edl-v1.json`'s `clip-b`).
///      Any other `EdlEffect.type` is recognized but left a no-op — see
///      `EdlVideoCompositionInstruction`'s doc comment for why that's a
///      documented limitation, not a silent bug.
///
/// Text/sticker overlays are NOT this compositor's job — they're composited
/// afterward via `AVVideoCompositionCoreAnimationTool`
/// (`OverlayLayerBuilder.swift`), which Apple's docs confirm layers on top
/// of whatever `customVideoCompositorClass` produces.
/// Geometry for placing one source's decoded frames into the render frame —
/// the custom-compositor equivalent of the preview renderer's
/// `computeVisualTransform` (`frame-descriptor.ts`), carrying the SAME EDL
/// clip transform plus the asset's container rotation. Custom compositors
/// receive RAW decoded buffers: AVFoundation applies neither the track's
/// `preferredTransform` nor any fitting, so before this existed a source
/// whose coded size differed from `renderSize` rendered un-scaled at the
/// buffer's bottom-left (Core Image's origin) with black everywhere else —
/// the "video only fills the bottom-left quarter" export bug.
public struct SourcePlacement {
	/// EDL clip transform, authored in the preview's screen convention:
	/// position offsets from canvas center, +Y DOWN, rotation clockwise.
	public let transform: EdlTransform
	/// Container display rotation (0|90|180|270, from `EdlAsset
	/// .rotationDegrees` == MediaProbe's preferredTransform decode) that
	/// uprights the coded frame.
	public let rotationDegrees: Int
	public let opacity: Double
	/// Round 47: the clip's keyframe channels on the six visual paths, or
	/// nil for a static clip. When set, `transform`/`opacity` above are the
	/// BASE values and the per-frame values come from `resolved(at:)`.
	public let animation: PlacementAnimation?

	public init(transform: EdlTransform, rotationDegrees: Int, opacity: Double, animation: PlacementAnimation? = nil) {
		self.transform = transform
		self.rotationDegrees = rotationDegrees
		self.opacity = opacity
		self.animation = animation
	}

	public static let identity = SourcePlacement(
		transform: EdlTransform(positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotateDegrees: 0),
		rotationDegrees: 0,
		opacity: 1
	)

	public var isAnimated: Bool { animation != nil }

	/// The static placement for one output frame: keyframe channels
	/// evaluated at the clip-local tick under `compositionTicks`. A static
	/// placement returns itself.
	public func resolved(atCompositionTicks compositionTicks: Int64) -> SourcePlacement {
		guard let animation else { return self }
		let localTicks = animation.localTicks(atCompositionTicks: compositionTicks)
		return SourcePlacement(
			transform: KeyframeEvaluator.resolveTransform(base: transform, channels: animation.channels, localTicks: localTicks),
			rotationDegrees: rotationDegrees,
			opacity: KeyframeEvaluator.resolveOpacity(base: opacity, channels: animation.channels, localTicks: localTicks),
			animation: nil
		)
	}
}

/// Round 47: what turns composition time into a keyframe lookup. Keyframe
/// times are CLIP-LOCAL (relative to the clip's start, exactly like the
/// preview's `getElementLocalTime`, which also clamps to [0, duration]); the
/// clip's start here is its OUTPUT-timeline start — `ClipPlacement
/// .insertStartTicks` for a main-track clip (transitions pull clips earlier
/// than their nominal `startTicks`), the remapped `startTicks` for overlays.
public struct PlacementAnimation {
	public let channels: [String: EdlAnimationChannel]
	public let clipStartTicks: Int64
	public let clipDurationTicks: Int64

	public init(channels: [String: EdlAnimationChannel], clipStartTicks: Int64, clipDurationTicks: Int64) {
		self.channels = channels
		self.clipStartTicks = clipStartTicks
		self.clipDurationTicks = clipDurationTicks
	}

	/// nil when the clip has no keyframes on a visual path — the common
	/// case, so static clips never pay for a lookup.
	public static func make(clip: EdlClip, clipStartTicks: Int64) -> PlacementAnimation? {
		let channels = KeyframeEvaluator.visualChannels(clip: clip)
		guard !channels.isEmpty else { return nil }
		return PlacementAnimation(channels: channels, clipStartTicks: clipStartTicks, clipDurationTicks: clip.durationTicks)
	}

	func localTicks(atCompositionTicks compositionTicks: Int64) -> Int64 {
		max(0, min(clipDurationTicks, compositionTicks - clipStartTicks))
	}
}

/// One picture-in-picture layer composited ABOVE the main track (round 19:
/// "export NEEDS to do it"). Video overlays pull decoded frames from their
/// own composition lane (`.track`); image overlays are decoded once at
/// build time and carried as a static CIImage (`.still`) — both go through
/// the SAME `SourcePlacement` placement as the main track, so preview and
/// export agree by construction.
public struct OverlayVideoLayer {
	public enum Source {
		case track(CMPersistentTrackID)
		case still(CIImage)
	}
	public let source: Source
	public let placement: SourcePlacement
	/// Active window in OUTPUT (transition-remapped) composition time.
	public let timeRange: CMTimeRange
	/// EDL track zIndex — layers composite in ascending order (higher = on
	/// top), matching OverlayLayerBuilder's CALayer ordering.
	public let zIndex: Int
	public let grades: [ShaderGrade]
	public let blurIntensity: Double
	public let mask: ExportMask?

	public init(
		source: Source,
		placement: SourcePlacement,
		timeRange: CMTimeRange,
		zIndex: Int,
		grades: [ShaderGrade] = [],
		blurIntensity: Double = 0,
		mask: ExportMask? = nil
	) {
		self.source = source
		self.placement = placement
		self.timeRange = timeRange
		self.zIndex = zIndex
		self.grades = grades
		self.blurIntensity = blurIntensity
		self.mask = mask
	}

	var trackID: CMPersistentTrackID? {
		if case .track(let id) = source { return id }
		return nil
	}
}

/// One karaoke state of an `OverlayBillboard`: the image that shows from
/// `startSeconds` (output/composition time) until the next state starts.
public struct OverlayBillboardState {
	public let startSeconds: Double
	public let image: CIImage
	/// When set, draw time replaces `image` with a finite decode of this
	/// sandbox PNG. One frame is cached. Missing or non-finite files are
	/// skipped rather than composited.
	public let pngPath: String?

	public init(startSeconds: Double, image: CIImage, pngPath: String? = nil) {
		self.startSeconds = startSeconds
		self.image = image
		self.pngPath = pngPath
	}
}

/// On-demand overlay PNG decode. `CIImage(contentsOf:)` stays lazy until
/// the compositor renders it, and a file-backed image can report an
/// infinite extent. Thumbnail decode via ImageIO matches the still-image
/// path (`loadStillImage`) and keeps a single finite bitmap.
enum OverlayPngLoader {
	private static let lock = NSLock()
	private static var cachedPath: String?
	private static var cachedImage: CIImage?
	private static var loggedFirst = false
	private static var skipped = 0

	static func image(atPath path: String) -> CIImage? {
		lock.lock()
		defer { lock.unlock() }
		if path == cachedPath, let cachedImage { return cachedImage }
		let url = URL(fileURLWithPath: path)
		guard FileManager.default.fileExists(atPath: url.path) else {
			noteSkip(detail: "missing path=\(url.path)")
			return nil
		}
		guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else {
			noteSkip(detail: "unreadable path=\(url.path)")
			return nil
		}
		let options: [CFString: Any] = [
			kCGImageSourceCreateThumbnailFromImageAlways: true,
			kCGImageSourceCreateThumbnailWithTransform: true,
			kCGImageSourceThumbnailMaxPixelSize: 2160,
		]
		guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
			noteSkip(detail: "thumbnail failed path=\(url.path)")
			return nil
		}
		var image = CIImage(cgImage: cgImage)
		let extent = image.extent
		let finite = extent.origin.x.isFinite && extent.origin.y.isFinite
			&& extent.width.isFinite && extent.height.isFinite
			&& extent.width > 0 && extent.height > 0
			&& extent.width < 8000 && extent.height < 8000
		guard finite else {
			noteSkip(detail: "non-finite extent=\(extent) path=\(url.path)")
			return nil
		}
		if extent.origin != .zero {
			image = image.transformed(by: CGAffineTransform(
				translationX: -extent.origin.x,
				y: -extent.origin.y
			))
		}
		if !loggedFirst {
			loggedFirst = true
			print("[kneecap-export] overlay png decoded path=\(url.path) extent=\(Int(extent.width))x\(Int(extent.height))")
		}
		cachedPath = path
		cachedImage = image
		return image
	}

	private static func noteSkip(detail: String) {
		skipped += 1
		if skipped <= 3 {
			print("[kneecap-export] overlay png skipped #\(skipped) \(detail)")
		}
	}
}

/// A pre-rasterized text/sticker/caption overlay, composited per frame by
/// the custom compositor (round 23). This REPLACES the
/// `AVVideoCompositionCoreAnimationTool` CALayer path: AVFoundation ignores
/// the animation tool whenever `customVideoCompositorClass` is set (this
/// pipeline always sets it), so the CALayer overlays never rendered in any
/// export — proven empirically by a probe (white 80pt text over the black
/// letterbox band exported to nothing; the old golden-frame cyan check was
/// a false positive fed by the colorful fixture).
public struct OverlayBillboard {
	/// Sorted ascending by `startSeconds`; the LAST state whose start is
	/// <= the frame time renders (sticky karaoke). One state = static.
	public let states: [OverlayBillboardState]
	/// Display rect in OUTPUT pixels, top-left origin, +Y down (the EDL's
	/// screen convention) — flipped into Core Image space at composite time.
	public let rect: CGRect
	public let opacity: Double
	/// Active window in OUTPUT (transition-remapped) composition time.
	public let timeRange: CMTimeRange
	public let zIndex: Int

	public init(states: [OverlayBillboardState], rect: CGRect, opacity: Double, timeRange: CMTimeRange, zIndex: Int) {
		self.states = states
		self.rect = rect
		self.opacity = opacity
		self.timeRange = timeRange
		self.zIndex = zIndex
	}
}

/// Shader units for `color-adjust` (`packages/editor-core/src/effects/grade.ts`
/// and `color_adjust.wgsl`). Filter presets and the Adjust panel both become
/// one of these. The matrix is the WGSL color section; sharpen and vignette
/// stay spatial.
public struct ShaderGrade {
	public var brightness: Double
	public var contrast: Double
	public var saturation: Double
	public var temperature: Double
	public var tint: Double
	public var sharpen: Double
	public var vignette: Double

	public init(brightness: Double, contrast: Double, saturation: Double, temperature: Double, tint: Double, sharpen: Double, vignette: Double) {
		self.brightness = brightness
		self.contrast = contrast
		self.saturation = saturation
		self.temperature = temperature
		self.tint = tint
		self.sharpen = sharpen
		self.vignette = vignette
	}

	public var affectsColor: Bool {
		brightness != 0 || abs(contrast - 1) > 0.000_001 || abs(saturation - 1) > 0.000_001 || temperature != 0 || tint != 0
	}

	func apply(to input: CIImage, renderSize: CGSize) -> CIImage {
		var image = input
		if sharpen > 0 {
			image = image.applyingFilter("CISharpenLuminance", parameters: [
				"inputSharpness": sharpen * 0.9,
			])
		}
		if affectsColor {
			image = Self.applyMatrix(to: image, grade: self)
		}
		if vignette > 0 {
			image = image.applyingFilter("CIVignette", parameters: [
				"inputIntensity": vignette * 1.6,
				"inputRadius": min(renderSize.width, renderSize.height) / 200.0,
			])
		}
		return image
	}

	static func fromAdjust(_ params: [String: AnyCodableValue]) -> ShaderGrade? {
		func value(_ key: String) -> Double { params[key]?.asDouble ?? 0 }
		let grade = ShaderGrade(
			brightness: (value("brightness") / 100) * 0.35,
			contrast: 1 + (value("contrast") / 100) * 0.6,
			saturation: max(0, 1 + value("saturation") / 100),
			temperature: value("temperature") / 100,
			tint: value("tint") / 100,
			sharpen: value("sharpen") / 100,
			vignette: value("vignette") / 100
		)
		let neutral = grade.brightness == 0 && grade.contrast == 1 && grade.saturation == 1
			&& grade.temperature == 0 && grade.tint == 0 && grade.sharpen == 0 && grade.vignette == 0
		return neutral ? nil : grade
	}

	static func fromFilter(_ params: [String: AnyCodableValue]) -> ShaderGrade? {
		let preset = params["preset"]?.asString ?? "none"
		let targets: [String: (Double, Double, Double, Double, Double)] = [
			"vivid": (0.03, 1.15, 1.35, 0.08, 0),
			"mono": (0, 1.08, 0, 0, 0),
			"vintage": (0.04, 0.92, 0.62, 0.55, 0.12),
			"cool": (0, 1.06, 0.92, -0.72, 0.08),
			"warm": (0.03, 1.05, 1.08, 0.62, -0.06),
			"cinematic": (-0.03, 1.2, 0.78, -0.22, 0.1),
		]
		guard let target = targets[preset] else { return nil }
		let mix = min(1, max(0, (params["intensity"]?.asDouble ?? 100) / 100))
		if mix == 0 { return nil }
		let grade = ShaderGrade(
			brightness: target.0 * mix,
			contrast: 1 + (target.1 - 1) * mix,
			saturation: 1 + (target.2 - 1) * mix,
			temperature: target.3 * mix,
			tint: target.4 * mix,
			sharpen: 0,
			vignette: 0
		)
		return grade.affectsColor ? grade : nil
	}

	/// Column-major 4×4, same product as `shaderGradeMatrix` in grade.ts.
	static func matrix(_ grade: ShaderGrade) -> [Double] {
		let temperature = translation(grade.temperature * 0.12 + grade.tint * 0.05, -grade.tint * 0.10, -grade.temperature * 0.12 + grade.tint * 0.05)
		let brightness = translation(grade.brightness, grade.brightness, grade.brightness)
		let bias = 0.5 - 0.5 * grade.contrast
		let contrast = [
			grade.contrast, 0, 0, 0,
			0, grade.contrast, 0, 0,
			0, 0, grade.contrast, 0,
			bias, bias, bias, 1,
		]
		let inv = 1 - grade.saturation
		let sat = grade.saturation
		let rw = 0.2126, gw = 0.7152, bw = 0.0722
		let saturation = [
			sat + inv * rw, inv * rw, inv * rw, 0,
			inv * gw, sat + inv * gw, inv * gw, 0,
			inv * bw, inv * bw, sat + inv * bw, 0,
			0, 0, 0, 1,
		]
		return matMul(saturation, matMul(contrast, matMul(brightness, temperature)))
	}

	private static func translation(_ x: Double, _ y: Double, _ z: Double) -> [Double] {
		[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
	}

	private static func matMul(_ a: [Double], _ b: [Double]) -> [Double] {
		var out = [Double](repeating: 0, count: 16)
		for col in 0..<4 {
			for row in 0..<4 {
				var sum = 0.0
				for k in 0..<4 {
					sum += a[k * 4 + row] * b[col * 4 + k]
				}
				out[col * 4 + row] = sum
			}
		}
		return out
	}

	private static func applyMatrix(to image: CIImage, grade: ShaderGrade) -> CIImage {
		let m = matrix(grade)
		func at(_ row: Int, _ col: Int) -> CGFloat { CGFloat(m[col * 4 + row]) }
		let filtered = image.applyingFilter("CIColorMatrix", parameters: [
			"inputRVector": CIVector(x: at(0, 0), y: at(0, 1), z: at(0, 2), w: 0),
			"inputGVector": CIVector(x: at(1, 0), y: at(1, 1), z: at(1, 2), w: 0),
			"inputBVector": CIVector(x: at(2, 0), y: at(2, 1), z: at(2, 2), w: 0),
			"inputAVector": CIVector(x: 0, y: 0, z: 0, w: 1),
			"inputBiasVector": CIVector(x: at(0, 3), y: at(1, 3), z: at(2, 3), w: 0),
		])
		return filtered.applyingFilter("CIColorClamp", parameters: [
			"inputMinComponents": CIVector(x: 0, y: 0, z: 0, w: 0),
			"inputMaxComponents": CIVector(x: 1, y: 1, z: 1, w: 1),
		])
	}
}

/// Ellipse, rectangle, and diamond in the preview's box-mask space
/// (`getBoxLikeGeometry`: fractions of the placed frame, Y down).
public struct ExportMask {
	public var type: String
	public var centerX: Double
	public var centerY: Double
	public var width: Double
	public var height: Double
	public var rotation: Double
	public var inverted: Bool
	public var feather: Double

	public static let renderedTypes: Set<String> = ["ellipse", "rectangle", "diamond"]

	public static func fromClip(_ clip: EdlClip) -> ExportMask? {
		guard let mask = clip.masks.first, renderedTypes.contains(mask.type) else { return nil }
		let params = mask.params
		return ExportMask(
			type: mask.type,
			centerX: params["centerX"]?.asDouble ?? 0,
			centerY: params["centerY"]?.asDouble ?? 0,
			width: params["width"]?.asDouble ?? 0.6,
			height: params["height"]?.asDouble ?? 0.6,
			rotation: params["rotation"]?.asDouble ?? 0,
			inverted: params["inverted"]?.asBool ?? false,
			feather: params["feather"]?.asDouble ?? 0
		)
	}
}

/// The full CapCut "Adjust" slider set (round 22 — founder: "adjustment to
/// video menu does not work in preview or in export"), values as authored
/// in the EDL effect params (-100...100, sharpen/vignette 0...100). Applied
/// as a CoreImage chain in the compositor; mapping constants chosen to
/// visually track the sliders at moderate settings.
public struct AdjustSettings {
	public let brightness: Double
	public let contrast: Double
	public let saturation: Double
	public let temperature: Double
	public let tint: Double
	public let sharpen: Double
	public let vignette: Double

	public init(brightness: Double, contrast: Double, saturation: Double, temperature: Double, tint: Double, sharpen: Double, vignette: Double) {
		self.brightness = brightness
		self.contrast = contrast
		self.saturation = saturation
		self.temperature = temperature
		self.tint = tint
		self.sharpen = sharpen
		self.vignette = vignette
	}

	public var isNeutral: Bool {
		brightness == 0 && contrast == 0 && saturation == 0 && temperature == 0 && tint == 0 && sharpen == 0 && vignette == 0
	}

	/// CoreImage chain — same ordering as CapCut's visual result: color
	/// controls, then white balance, then sharpen, then vignette.
	func apply(to input: CIImage, renderSize: CGSize) -> CIImage {
		var image = input
		if brightness != 0 || contrast != 0 || saturation != 0 {
			image = image.applyingFilter("CIColorControls", parameters: [
				"inputBrightness": brightness / 100.0 * 0.5,
				"inputContrast": 1.0 + contrast / 100.0 * 0.5,
				"inputSaturation": max(0, 1.0 + saturation / 100.0),
			])
		}
		if temperature != 0 || tint != 0 {
			image = image.applyingFilter("CITemperatureAndTint", parameters: [
				"inputNeutral": CIVector(x: 6500 - CGFloat(temperature) * 30, y: CGFloat(tint) * 0.5),
				"inputTargetNeutral": CIVector(x: 6500, y: 0),
			])
		}
		if sharpen > 0 {
			image = image.applyingFilter("CISharpenLuminance", parameters: [
				"inputSharpness": sharpen / 100.0 * 0.9,
			])
		}
		if vignette > 0 {
			image = image.applyingFilter("CIVignette", parameters: [
				"inputIntensity": vignette / 100.0 * 1.6,
				"inputRadius": min(renderSize.width, renderSize.height) / 200.0,
			])
		}
		return image
	}
}

public final class EdlVideoCompositionInstruction: NSObject, AVVideoCompositionInstructionProtocol {
	public var timeRange: CMTimeRange
	public var enablePostProcessing: Bool = false
	public var containsTupledInstructions: Bool = false
	/// Blending two DIFFERENT source frames at different composition times
	/// within a transition window produces different output — the dissolve
	/// progress genuinely varies with `compositionTime` — so `true` for a
	/// dual-source (transition) instruction; a single-source passthrough
	/// (optionally brightness-adjusted, itself time-invariant per frame) is
	/// `false`, letting the media pipeline skip redundant re-composition.
	public var containsTweening: Bool
	public var requiredSourceTrackIDs: [NSValue]?
	public var passthroughTrackID: CMPersistentTrackID = kCMPersistentTrackID_Invalid

	public let primaryTrackID: CMPersistentTrackID
	public let secondaryTrackID: CMPersistentTrackID
	/// Build-time-decoded STILL sources (round 28): a main-track IMAGE clip
	/// has no composition lane — a JPEG can't open as an AVURLAsset (the
	/// -11828 "Cannot Open"/assetProperty_Tracks export failure on device,
	/// 2026-08-23) — so its frames come from a decoded CIImage instead,
	/// exactly like the PiP `.still` overlay path. Set only when the
	/// matching trackID is `kCMPersistentTrackID_Invalid`. Both nil AND an
	/// invalid primary track ⇒ a background-only segment (unreadable image
	/// degrades to canvas background instead of failing the whole export).
	public let primaryStill: CIImage?
	public let secondaryStill: CIImage?
	/// `nil` for a plain single-source instruction. When set (both together,
	/// always), describes the cross-fade window this instruction's
	/// `timeRange` falls entirely inside, already converted to `CMTime` at
	/// `meta.ticksPerSecond` by `VideoCompositionBuilder` (via `EdlTime`) —
	/// this class never re-derives a timescale from raw tick counts itself,
	/// so there is exactly one seconds-conversion per window, done once,
	/// upstream.
	public let transitionWindowStart: CMTime?
	public let transitionWindowDuration: CMTime?
	public let transitionKind: String?
	/// Brightness adjustment (`CIColorControls.inputBrightness` units,
	/// roughly -1...1) for the PRIMARY source, if its clip carries an
	/// enabled `"brightness"` effect. `nil` means "no adjustment" (the
	/// common case) — kept optional rather than defaulting to 0 so the
	/// compositor can skip the CIFilter pass entirely for un-effected
	/// frames, which is the overwhelming majority of any real timeline.
	public let primaryBrightness: Double?
	public let secondaryBrightness: Double?
	/// Full Adjust set per source (round 22); nil == no adjust effect.
	public let primaryAdjust: AdjustSettings?
	public let secondaryAdjust: AdjustSettings?
	/// Filter and adjust grades, in effect-list order. Applied after the
	/// legacy brightness effect and before blur.
	public let primaryGrades: [ShaderGrade]
	public let secondaryGrades: [ShaderGrade]
	/// Blur effect intensity (0...100). Sigma is resolved from the source
	/// frame size at draw time so it matches `intensityToSigma`.
	public let primaryBlurIntensity: Double
	public let secondaryBlurIntensity: Double
	public let primaryMask: ExportMask?
	public let secondaryMask: ExportMask?
	/// Placement of each source into the render frame (preview-parity fit +
	/// clip transform). Defaults to `.identity` (center, contain-fit only)
	/// so a caller that has no EDL context still gets a full-frame result.
	public let primaryPlacement: SourcePlacement
	public let secondaryPlacement: SourcePlacement
	/// Canvas background the sources composite over (EDL `meta.background`
	/// when it is a flat color; opaque black otherwise/by default).
	public let backgroundColor: CIColor
	/// Picture-in-picture layers whose windows intersect this instruction's
	/// time range, ascending zIndex (composited in order, last on top).
	public let overlayVideoLayers: [OverlayVideoLayer]
	/// Text/sticker/caption billboards intersecting this instruction's
	/// range, ascending zIndex — composited ABOVE the PiP layers (text over
	/// video overlays, same stacking the preview renders).
	public let overlayBillboards: [OverlayBillboard]
	/// `meta.ticksPerSecond` — composition time -> ticks for keyframe lookups.
	public let ticksPerSecond: Int64

	init(
		timeRange: CMTimeRange,
		primaryTrackID: CMPersistentTrackID,
		secondaryTrackID: CMPersistentTrackID = kCMPersistentTrackID_Invalid,
		primaryStill: CIImage? = nil,
		secondaryStill: CIImage? = nil,
		/// The still-pacer lane (BuiltComposition.stillPacerTrackID): listed
		/// in requiredSourceTrackIDs so the reader SCHEDULES this
		/// instruction's frames — an instruction requiring no tracks is
		/// never composed. The compositor never reads its frames.
		pacerTrackID: CMPersistentTrackID = kCMPersistentTrackID_Invalid,
		transitionWindowStart: CMTime? = nil,
		transitionWindowDuration: CMTime? = nil,
		transitionKind: String? = nil,
		primaryBrightness: Double? = nil,
		secondaryBrightness: Double? = nil,
		primaryAdjust: AdjustSettings? = nil,
		secondaryAdjust: AdjustSettings? = nil,
		primaryGrades: [ShaderGrade] = [],
		secondaryGrades: [ShaderGrade] = [],
		primaryBlurIntensity: Double = 0,
		secondaryBlurIntensity: Double = 0,
		primaryMask: ExportMask? = nil,
		secondaryMask: ExportMask? = nil,
		primaryPlacement: SourcePlacement = .identity,
		secondaryPlacement: SourcePlacement = .identity,
		backgroundColor: CIColor = CIColor(red: 0, green: 0, blue: 0, alpha: 1),
		overlayVideoLayers: [OverlayVideoLayer] = [],
		overlayBillboards: [OverlayBillboard] = [],
		ticksPerSecond: Int64 = 120_000
	) {
		self.timeRange = timeRange
		self.primaryTrackID = primaryTrackID
		self.secondaryTrackID = secondaryTrackID
		self.primaryStill = primaryStill
		self.secondaryStill = secondaryStill
		self.transitionWindowStart = transitionWindowStart
		self.transitionWindowDuration = transitionWindowDuration
		self.transitionKind = transitionKind
		self.primaryBrightness = primaryBrightness
		self.secondaryBrightness = secondaryBrightness
		self.primaryAdjust = primaryAdjust
		self.secondaryAdjust = secondaryAdjust
		self.primaryGrades = primaryGrades
		self.secondaryGrades = secondaryGrades
		self.primaryBlurIntensity = primaryBlurIntensity
		self.secondaryBlurIntensity = secondaryBlurIntensity
		self.primaryMask = primaryMask
		self.secondaryMask = secondaryMask
		self.primaryPlacement = primaryPlacement
		self.secondaryPlacement = secondaryPlacement
		self.backgroundColor = backgroundColor
		self.overlayVideoLayers = overlayVideoLayers
		self.overlayBillboards = overlayBillboards
		self.ticksPerSecond = ticksPerSecond
		// Round 47: a keyframed placement varies frame to frame exactly like a
		// dissolve does — without `containsTweening` AVFoundation may reuse a
		// composed frame across identical source frames (a still, a paused
		// source) and the animation would stutter or freeze.
		self.containsTweening =
			secondaryTrackID != kCMPersistentTrackID_Invalid || secondaryStill != nil
			|| primaryPlacement.isAnimated || secondaryPlacement.isAnimated
			|| overlayVideoLayers.contains { $0.placement.isAnimated }
		// `requiredSourceTrackIDs` is typed `[NSValue]?`, but AVFoundation's
		// OWN validation (`-[AVVideoComposition
		// isValidForTracks:assetDuration:timeRange:validationDelegate:]`)
		// calls `-intValue` on each element internally — which only
		// `NSNumber` (a subclass of `NSValue`) responds to. Confirmed by a
		// real crash in this repo's own `verify-export-pipeline` harness
		// against `NSValue(nonretainedObject:)`-wrapped values ("-
		// [NSConcreteValue intValue]: unrecognized selector"): the correct
		// construction is a bare `NSNumber`, upcast to `NSValue` for the
		// array's declared element type via inheritance, not a second
		// `NSValue` layer wrapping one.
		self.requiredSourceTrackIDs = ([primaryTrackID, secondaryTrackID, pacerTrackID] + overlayVideoLayers.compactMap(\.trackID))
			.filter { $0 != kCMPersistentTrackID_Invalid }
			.map { NSNumber(value: $0) as NSValue }
		super.init()
	}
}

public enum TransitionCompositorError: Error {
	case missingPrimarySourceFrame
	case missingOutputPixelBuffer
}

public final class EdlTransitionCompositor: NSObject, AVVideoCompositing {
	public var sourcePixelBufferAttributes: [String: any Sendable]? = [
		kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
	]
	public var requiredPixelBufferAttributesForRenderContext: [String: any Sendable] = [
		kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
	]

	private let ciContext = CIContext()
	private var renderContextQueue = DispatchQueue(label: "app.kneecap.export.compositor.context")
	private var renderContext: AVVideoCompositionRenderContext?

	public func renderContextChanged(_ newRenderContext: AVVideoCompositionRenderContext) {
		renderContextQueue.sync { renderContext = newRenderContext }
	}

	public func startRequest(_ asyncVideoCompositionRequest: AVAsynchronousVideoCompositionRequest) {
		autoreleasepool {
			guard let instruction = asyncVideoCompositionRequest.videoCompositionInstruction as? EdlVideoCompositionInstruction else {
				asyncVideoCompositionRequest.finish(with: NSError(
					domain: "app.kneecap.export",
					code: -1,
					userInfo: [NSLocalizedDescriptionKey: "unexpected instruction type"]
				))
				return
			}
			// Primary source: a composition-lane frame (video), a build-time
			// still (main-track image — see `primaryStill`'s doc comment), or
			// nothing (background-only segment).
			let primarySource: CIImage?
			if instruction.primaryTrackID != kCMPersistentTrackID_Invalid {
				guard let primaryBuffer = asyncVideoCompositionRequest.sourceFrame(byTrackID: instruction.primaryTrackID) else {
					asyncVideoCompositionRequest.finish(with: NSError(
						domain: "app.kneecap.export",
						code: -2,
						userInfo: [NSLocalizedDescriptionKey: "no primary source frame at track \(instruction.primaryTrackID)"]
					))
					return
				}
				primarySource = CIImage(cvPixelBuffer: primaryBuffer)
			} else {
				primarySource = instruction.primaryStill
			}

			// The render frame is renderContext.size (== composition.renderSize),
			// NOT the source buffer's size — conflating the two is the original
			// bottom-left-quarter bug this placement pass exists to fix.
			let renderSize = renderContextQueue.sync { renderContext?.size } ?? .zero
			guard renderSize.width > 0, renderSize.height > 0 else {
				asyncVideoCompositionRequest.finish(with: TransitionCompositorError.missingOutputPixelBuffer)
				return
			}
			let renderRect = CGRect(origin: .zero, size: renderSize)
			let background = CIImage(color: instruction.backgroundColor).cropped(to: renderRect)
			// Round 47: keyframed placements resolve ONCE per frame here, in
			// output ticks — the same tick space the instruction ranges use.
			let compositionTicks = Int64((asyncVideoCompositionRequest.compositionTime.seconds * Double(instruction.ticksPerSecond)).rounded())

			var image: CIImage
			if var primaryImage = primarySource {
				if let brightness = instruction.primaryBrightness {
					primaryImage = primaryImage.applyingFilter("CIColorControls", parameters: ["inputBrightness": brightness])
				}
				if let adjust = instruction.primaryAdjust {
					primaryImage = adjust.apply(to: primaryImage, renderSize: renderSize)
				}
				primaryImage = Self.grade(primaryImage, grades: instruction.primaryGrades, blurIntensity: instruction.primaryBlurIntensity, renderSize: renderSize)
				primaryImage = Self.place(
					image: primaryImage,
					placement: instruction.primaryPlacement.resolved(atCompositionTicks: compositionTicks),
					renderSize: renderSize
				)
				if let mask = instruction.primaryMask {
					primaryImage = Self.applyExportMask(mask, to: primaryImage, renderSize: renderSize)
				}
				image = primaryImage.composited(over: background)
			} else {
				image = background
			}

			let secondarySource: CIImage?
			if instruction.secondaryTrackID != kCMPersistentTrackID_Invalid {
				secondarySource = asyncVideoCompositionRequest
					.sourceFrame(byTrackID: instruction.secondaryTrackID)
					.map { CIImage(cvPixelBuffer: $0) }
			} else {
				secondarySource = instruction.secondaryStill
			}
			if var secondaryImage = secondarySource {
				if let brightness = instruction.secondaryBrightness {
					secondaryImage = secondaryImage.applyingFilter("CIColorControls", parameters: ["inputBrightness": brightness])
				}
				if let adjust = instruction.secondaryAdjust {
					secondaryImage = adjust.apply(to: secondaryImage, renderSize: renderSize)
				}
				secondaryImage = Self.grade(secondaryImage, grades: instruction.secondaryGrades, blurIntensity: instruction.secondaryBlurIntensity, renderSize: renderSize)
				secondaryImage = Self.place(
					image: secondaryImage,
					placement: instruction.secondaryPlacement.resolved(atCompositionTicks: compositionTicks),
					renderSize: renderSize
				)
				if let mask = instruction.secondaryMask {
					secondaryImage = Self.applyExportMask(mask, to: secondaryImage, renderSize: renderSize)
				}
				secondaryImage = secondaryImage.composited(over: background)
				let progress = Self.progress(
					at: asyncVideoCompositionRequest.compositionTime,
					windowStart: instruction.transitionWindowStart ?? .zero,
					windowDuration: instruction.transitionWindowDuration ?? .zero
				)
				image = Self.blend(
					from: image,
					to: secondaryImage,
					progress: progress,
					kind: instruction.transitionKind ?? "cross_fade"
				)
			}

			// Picture-in-picture layers, ascending zIndex (pre-sorted by
			// VideoCompositionBuilder): each active layer's frame is placed
			// with the SAME SourcePlacement math as the main track and
			// composited on top. A lane with no media at this time yields a
			// nil sourceFrame and is skipped — not an error.
			let compositionTime = asyncVideoCompositionRequest.compositionTime
			for layer in instruction.overlayVideoLayers {
				guard layer.timeRange.containsTime(compositionTime) else { continue }
				var layerImage: CIImage
				switch layer.source {
				case .track(let trackID):
					guard let buffer = asyncVideoCompositionRequest.sourceFrame(byTrackID: trackID) else { continue }
					layerImage = CIImage(cvPixelBuffer: buffer)
				case .still(let stillImage):
					layerImage = stillImage
				}
				layerImage = Self.grade(layerImage, grades: layer.grades, blurIntensity: layer.blurIntensity, renderSize: renderSize)
				layerImage = Self.place(
					image: layerImage,
					placement: layer.placement.resolved(atCompositionTicks: compositionTicks),
					renderSize: renderSize
				)
				if let mask = layer.mask {
					layerImage = Self.applyExportMask(mask, to: layerImage, renderSize: renderSize)
				}
				image = layerImage.composited(over: image)
			}

			// Text/sticker/caption billboards, above PiP. State selection is
			// the sticky-karaoke rule: the last state whose start has passed.
			for billboard in instruction.overlayBillboards {
				guard billboard.timeRange.containsTime(compositionTime) else { continue }
				let seconds = compositionTime.seconds
				var state = billboard.states.first
				for candidate in billboard.states where candidate.startSeconds <= seconds {
					state = candidate
				}
				guard let state else { continue }
				var stateImage = state.image
				if let path = state.pngPath, !path.isEmpty {
					guard let decoded = OverlayPngLoader.image(atPath: path) else { continue }
					stateImage = decoded
				}
				let extent = stateImage.extent
				guard extent.origin.x.isFinite, extent.origin.y.isFinite,
				      extent.width.isFinite, extent.height.isFinite,
				      extent.width > 0, extent.height > 0 else {
					continue
				}
				// rect is top-left/+Y-down (screen convention); CI is
				// bottom-left/+Y-up — flip once here, same as `place`.
				let scaleX = billboard.rect.width / extent.width
				let scaleY = billboard.rect.height / extent.height
				let ciOriginY = renderSize.height - billboard.rect.maxY
				var placed = stateImage
					.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
					.transformed(by: CGAffineTransform(translationX: billboard.rect.minX, y: ciOriginY))
				if billboard.opacity < 1 {
					placed = placed.applyingFilter("CIColorMatrix", parameters: [
						"inputAVector": CIVector(x: 0, y: 0, z: 0, w: CGFloat(billboard.opacity)),
					])
				}
				image = placed.composited(over: image)
			}

			guard let outputBuffer = renderContext?.newPixelBuffer() else {
				asyncVideoCompositionRequest.finish(with: TransitionCompositorError.missingOutputPixelBuffer)
				return
			}
			ciContext.render(image.cropped(to: renderRect), to: outputBuffer)
			asyncVideoCompositionRequest.finish(withComposedVideoFrame: outputBuffer)
		}
	}

	static func grade(_ image: CIImage, grades: [ShaderGrade], blurIntensity: Double, renderSize: CGSize) -> CIImage {
		var result = image
		for grade in grades {
			result = grade.apply(to: result, renderSize: renderSize)
		}
		guard blurIntensity > 0.001 else { return result }
		let extent = result.extent
		guard extent.width > 1, extent.height > 1, extent.width.isFinite, extent.height.isFinite else { return result }
		let sigmaX = (blurIntensity / 5.0) * (extent.width / 1920.0)
		let sigmaY = (blurIntensity / 5.0) * (extent.height / 1080.0)
		let radius = max(sigmaX, sigmaY)
		guard radius > 0.05 else { return result }
		let blurred = result.clampedToExtent().applyingFilter("CIGaussianBlur", parameters: ["inputRadius": radius])
		return blurred.cropped(to: extent)
	}

	static func applyExportMask(_ mask: ExportMask, to image: CIImage, renderSize: CGSize) -> CIImage {
		guard let maskImage = maskBitmap(mask, renderSize: renderSize) else { return image }
		let renderRect = CGRect(origin: .zero, size: renderSize)
		let clear = CIImage(color: CIColor(red: 0, green: 0, blue: 0, alpha: 0)).cropped(to: renderRect)
		let masked = image.applyingFilter("CIBlendWithMask", parameters: [
			kCIInputBackgroundImageKey: clear,
			kCIInputMaskImageKey: maskImage,
		])
		return masked.cropped(to: renderRect)
	}

	private static func maskBitmap(_ mask: ExportMask, renderSize: CGSize) -> CIImage? {
		guard ExportMask.renderedTypes.contains(mask.type) else { return nil }
		let width = Int(renderSize.width.rounded())
		let height = Int(renderSize.height.rounded())
		guard width > 1, height > 1 else { return nil }
		// DeviceGray, origin bottom-left, matches CIImage(cgImage:). Canvas Y
		// (down) is flipped once here so a positive centerY moves the hole down
		// on screen, the same way getBoxLikeGeometry does.
		guard let ctx = CGContext(
			data: nil,
			width: width,
			height: height,
			bitsPerComponent: 8,
			bytesPerRow: width,
			space: CGColorSpaceCreateDeviceGray(),
			bitmapInfo: CGImageAlphaInfo.none.rawValue
		) else { return nil }
		ctx.setFillColor(gray: 0, alpha: 1)
		ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
		let frameW = CGFloat(width)
		let frameH = CGFloat(height)
		let centerX = frameW / 2 + CGFloat(mask.centerX) * frameW
		let canvasCenterY = frameH / 2 + CGFloat(mask.centerY) * frameH
		let centerY = frameH - canvasCenterY
		let maskW = max(CGFloat(mask.width), 0.01) * frameW
		let maskH = max(CGFloat(mask.height), 0.01) * frameH
		ctx.saveGState()
		ctx.translateBy(x: centerX, y: centerY)
		ctx.rotate(by: -CGFloat(mask.rotation) * .pi / 180)
		ctx.setFillColor(gray: 1, alpha: 1)
		let rect = CGRect(x: -maskW / 2, y: -maskH / 2, width: maskW, height: maskH)
		switch mask.type {
		case "ellipse":
			ctx.fillEllipse(in: rect)
		case "rectangle":
			ctx.fill(rect)
		case "diamond":
			ctx.beginPath()
			ctx.move(to: CGPoint(x: 0, y: maskH / 2))
			ctx.addLine(to: CGPoint(x: maskW / 2, y: 0))
			ctx.addLine(to: CGPoint(x: 0, y: -maskH / 2))
			ctx.addLine(to: CGPoint(x: -maskW / 2, y: 0))
			ctx.closePath()
			ctx.fillPath()
		default:
			ctx.restoreGState()
			return nil
		}
		ctx.restoreGState()
		guard let cgImage = ctx.makeImage() else { return nil }
		var bitmap = CIImage(cgImage: cgImage)
		if mask.inverted {
			bitmap = bitmap.applyingFilter("CIColorInvert")
		}
		let bounds = CGRect(x: 0, y: 0, width: width, height: height)
		if mask.feather > 0.5 {
			bitmap = bitmap.clampedToExtent()
				.applyingFilter("CIGaussianBlur", parameters: ["inputRadius": mask.feather / 2])
				.cropped(to: bounds)
		}
		return bitmap.cropped(to: bounds)
	}

	/// Preview-parity placement — the Core Image mirror of the web renderer's
	/// `computeVisualTransform` (frame-descriptor.ts):
	///
	///   1. upright the coded frame per the container rotation (custom
	///      compositors get RAW buffers; `preferredTransform` is NOT applied);
	///   2. contain-fit the upright frame into the render size
	///      (`min(rw/uw, rh/uh)` — same rule as preview);
	///   3. apply the clip transform: scale (negative = flip, same as
	///      preview's signed-scale convention), rotation, and center offset.
	///
	/// Coordinate care: the EDL transform is authored in the preview's
	/// screen space (origin top-left, +Y down, clockwise-positive rotation);
	/// Core Image is origin bottom-left, +Y up — so positionY and the
	/// rotation sign flip here, ONCE, in this one function.
	static func place(image: CIImage, placement: SourcePlacement, renderSize: CGSize) -> CIImage {
		var result = image

		if let orientation = Self.orientation(fromRotationDegrees: placement.rotationDegrees) {
			result = result.oriented(orientation)
		}
		// Normalize the (possibly oriented) extent back to a zero origin so
		// the center-anchored transform below starts from a known frame.
		let extent = result.extent
		if extent.origin != .zero {
			result = result.transformed(by: CGAffineTransform(
				translationX: -extent.origin.x,
				y: -extent.origin.y
			))
		}

		let uprightWidth = result.extent.width
		let uprightHeight = result.extent.height
		guard uprightWidth > 0, uprightHeight > 0 else { return result }

		let contain = min(renderSize.width / uprightWidth, renderSize.height / uprightHeight)
		let scaleX = contain * CGFloat(placement.transform.scaleX)
		let scaleY = contain * CGFloat(placement.transform.scaleY)
		let centerX = renderSize.width / 2 + CGFloat(placement.transform.positionX)
		let centerY = renderSize.height / 2 - CGFloat(placement.transform.positionY) // +Y down -> +Y up
		let rotation = -CGFloat(placement.transform.rotateDegrees) * .pi / 180 // CW screen -> CCW-positive CI

		// Applied to each point LAST-first: center the frame on the origin,
		// scale, rotate, then translate the origin to the target center.
		var transform = CGAffineTransform.identity
		transform = transform.translatedBy(x: centerX, y: centerY)
		transform = transform.rotated(by: rotation)
		transform = transform.scaledBy(x: scaleX, y: scaleY)
		transform = transform.translatedBy(x: -uprightWidth / 2, y: -uprightHeight / 2)
		result = result.transformed(by: transform)

		if placement.opacity < 1 {
			result = result.applyingFilter("CIColorMatrix", parameters: [
				"inputAVector": CIVector(x: 0, y: 0, z: 0, w: CGFloat(max(0, placement.opacity))),
			])
		}
		return result
	}

	/// EXIF orientation equivalent of the container's display rotation.
	/// `nil` for 0 (and any non-canonical value — MediaProbe only ever emits
	/// 0/90/180/270) so the common unrotated case skips the pass entirely.
	static func orientation(fromRotationDegrees degrees: Int) -> CGImagePropertyOrientation? {
		switch degrees {
		case 90: return .right
		case 180: return .down
		case 270: return .left
		default: return nil
		}
	}

	public func cancelAllPendingVideoCompositionRequests() {
		// Stateless per-request (no in-flight request state retained beyond
		// the call stack of `startRequest`), so there's nothing to tear
		// down — required by the protocol, documented as a deliberate no-op.
	}

	/// The precise, tick-based progress calculation `VideoCompositionBuilder`
	/// actually wires up: `compositionTime` and the window bounds are all
	/// converted through the SAME `ticksPerSecond` timescale
	/// (`EdlTime.swift`), so this never round-trips through a
	/// timescale-ambiguous `Double` the way the fallback above would.
	static func progress(at time: CMTime, windowStart: CMTime, windowDuration: CMTime) -> Double {
		guard windowDuration.seconds > 0 else { return 1 }
		let elapsed = time.seconds - windowStart.seconds
		return min(1, max(0, elapsed / windowDuration.seconds))
	}

	/// `CIDissolveTransition` is Apple's own built-in Core Image dissolve —
	/// i.e. a cross-fade — used directly rather than hand-rolled alpha
	/// compositing (plan §5 risk #4: "restrict v1 to transitions expressible
	/// as alpha/transform ramps over an overlap window" — a dissolve IS
	/// exactly that ramp, and `CIDissolveTransition` is the canonical
	/// Core Image primitive for it). Any `kind` other than a recognized
	/// cross-fade alias falls back to the same dissolve rather than
	/// aborting the export — an unrecognized transition KIND is a producer
	/// concern (the picker UI shouldn't offer it), not a reason for the
	/// exporter to fail an otherwise-valid EDL; see plan §2.3 rule 3, "any
	/// effect that cannot pass [golden-frame parity] is cut from v1" — that
	/// cutting happens at the UI/producer layer, this is the export layer's
	/// defensive fallback.
	static func blend(from: CIImage, to: CIImage, progress: Double, kind: String) -> CIImage {
		let filter = CIFilter(name: "CIDissolveTransition")
		filter?.setValue(from, forKey: kCIInputImageKey)
		filter?.setValue(to, forKey: "inputTargetImage")
		filter?.setValue(progress, forKey: "inputTime")
		guard let output = filter?.outputImage else {
			// Should not happen (CIDissolveTransition is always available),
			// but never crash an export over a filter-graph failure —
			// degrade to a hard cut at the midpoint instead.
			return progress < 0.5 ? from : to
		}
		// CIDissolveTransition's output extent is the union/intersection of
		// its two inputs' extents depending on their alpha; crop back to
		// `from`'s extent (both sources are always frames of identical
		// render-context size in this pipeline) so the composed frame has
		// no stray transparent border.
		return output.cropped(to: from.extent)
	}
}
