import Foundation
import AVFoundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

/// kneecap M4 item 5: "Thumbnail strip generation natively (filmstrip frames
/// at zoom-appropriate density), served from the local server — do NOT
/// decode filmstrip frames in JS."
///
/// Platform-agnostic for the same reason as `MediaProbe.swift` — see its
/// header comment.
public enum ThumbnailStripError: Error, CustomStringConvertible {
	case imageGenerationFailed(String)
	case jpegEncodeFailed
	case timedOut(Int)

	public var description: String {
		switch self {
		case .imageGenerationFailed(let m): return "thumbnail frame generation failed: \(m)"
		case .jpegEncodeFailed: return "JPEG encode failed"
		case .timedOut(let seconds): return "Import failed at thumbnails: timed out after \(seconds)s"
		}
	}
}

/// Import-time strip length. The timeline stores only the first frame
/// (`thumbnailUrl`). 500 serial exact-time grabs held `AVAssetImageGenerator`'s
/// decompression session; import #2's first callback then never fired and the
/// spinner stayed at 95%. Density beyond this poster strip is
/// `generateThumbnails`, not the import critical path.
public let importThumbnailCount = 12

public enum ImportStepTimeout: Error, CustomStringConvertible {
	case timedOut(step: String, seconds: Int)

	public var description: String {
		switch self {
		case .timedOut(let step, let seconds):
			return "Import failed at \(step): timed out after \(seconds)s"
		}
	}
}

/// Fails `operation` if it has not returned in `seconds`. Used for the
/// post-copy probe, whose `AVAsset.load` has no progress events.
public func withImportStepTimeout<T>(
	step: String,
	seconds: Int,
	operation: @escaping () async throws -> T
) async throws -> T {
	try await withThrowingTaskGroup(of: T.self) { group in
		group.addTask { try await operation() }
		group.addTask {
			try await Task.sleep(nanoseconds: UInt64(seconds) * 1_000_000_000)
			print("[import] stalled at \(step)")
			throw ImportStepTimeout.timedOut(step: step, seconds: seconds)
		}
		do {
			guard let value = try await group.next() else {
				throw ImportStepTimeout.timedOut(step: step, seconds: seconds)
			}
			group.cancelAll()
			return value
		} catch {
			group.cancelAll()
			throw error
		}
	}
}

public enum ThumbnailStripGenerator {
	/// Generates `count` evenly-spaced JPEG frames (sampled at each cell's
	/// midpoint, not its left edge, so the first/last thumbnails aren't the
	/// asset's very first/last frame) into `outputDirectory`, upright
	/// (`appliesPreferredTrackTransform = true` bakes in the same rotation
	/// `ProxyTranscoder` applies) and capped at `maxDimension` on the long
	/// edge — filmstrip cells, not full frames.
	@discardableResult
	public static func generate(
		sourceURL: URL,
		outputDirectory: URL,
		count: Int,
		maxDimension: CGFloat = 360,
		onProgress: ((Double) -> Void)? = nil,
		onGenerator: ((AVAssetImageGenerator) -> Void)? = nil
	) async throws -> [URL] {
		let asset = AVURLAsset(url: sourceURL)
		let duration = try await asset.load(.duration)
		let seconds = max(duration.seconds, 0.01)

		try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

		let generator = AVAssetImageGenerator(asset: asset)
		generator.appliesPreferredTrackTransform = true
		generator.maximumSize = CGSize(width: maxDimension, height: maxDimension)
		// Zero tolerance asks for an exact sample. Photos `.mov` edit lists
		// often have no sample at that time, and the handler is never called.
		// A tenth of a second is the same window `grabFrame` already uses.
		let tolerance = CMTime(seconds: 0.1, preferredTimescale: 600)
		generator.requestedTimeToleranceBefore = tolerance
		generator.requestedTimeToleranceAfter = tolerance
		onGenerator?(generator)
		// Required. Releasing the generator without cancelling leaves the
		// process-wide image-generation session up; the next import's first
		// `generateCGImageAsynchronously` then never invokes its handler.
		defer { generator.cancelAllCGImageGeneration() }

		let n = max(1, count)
		var urls: [URL] = []
		for i in 0..<n {
			let raw = seconds * (Double(i) + 0.5) / Double(n)
			let clamped = min(max(0, raw), max(0, seconds - 0.05))
			let time = CMTime(seconds: clamped, preferredTimescale: 600)
			let cgImage = try await requestImage(generator: generator, at: time, timeoutSeconds: 8)
			let outURL = outputDirectory.appendingPathComponent(String(format: "thumb-%03d.jpg", i))
			try writeJPEG(cgImage: cgImage, to: outURL)
			urls.append(outURL)
			onProgress?(Double(i + 1) / Double(n))
		}
		return urls
	}

	/// Resumes off the generator's callback queue. `continuation.resume`
	/// can continue the awaiting `for` loop on that queue, and the next
	/// `generateCGImageAsynchronously` then runs while the generator still
	/// holds its non-reentrant lock — the handler never fires.
	private static func requestImage(
		generator: AVAssetImageGenerator,
		at time: CMTime,
		timeoutSeconds: Int
	) async throws -> CGImage {
		try await withCheckedThrowingContinuation { continuation in
			let once = OnceResume()
			let timeout = DispatchWorkItem {
				print("[import] stalled at thumbnails")
				generator.cancelAllCGImageGeneration()
				once.run {
					continuation.resume(throwing: ThumbnailStripError.timedOut(timeoutSeconds))
				}
			}
			DispatchQueue.global(qos: .userInitiated).asyncAfter(
				deadline: .now() + .seconds(timeoutSeconds),
				execute: timeout
			)
			generator.generateCGImageAsynchronously(for: time) { cgImage, _, error in
				timeout.cancel()
				DispatchQueue.global(qos: .userInitiated).async {
					once.run {
						if let cgImage {
							continuation.resume(returning: cgImage)
						} else {
							continuation.resume(throwing: ThumbnailStripError.imageGenerationFailed(
								error?.localizedDescription ?? "unknown"
							))
						}
					}
				}
			}
		}
	}

	public static func grabFrame(sourceURL: URL, timeSeconds: Double, maxEdge: CGFloat) async throws -> (base64: String, width: Int, height: Int) {
		let asset = AVURLAsset(url: sourceURL)
		let generator = AVAssetImageGenerator(asset: asset)
		generator.appliesPreferredTrackTransform = true
		let edge = max(64, min(maxEdge, 1920))
		generator.maximumSize = CGSize(width: edge, height: edge)
		let tolerance = CMTime(seconds: 0.1, preferredTimescale: 600)
		generator.requestedTimeToleranceBefore = tolerance
		generator.requestedTimeToleranceAfter = tolerance
		defer { generator.cancelAllCGImageGeneration() }
		let time = CMTime(seconds: max(0, timeSeconds), preferredTimescale: 600)
		let cgImage = try await requestImage(generator: generator, at: time, timeoutSeconds: 8)
		let data = NSMutableData()
		guard let dest = CGImageDestinationCreateWithData(data, UTType.jpeg.identifier as CFString, 1, nil) else {
			throw ThumbnailStripError.jpegEncodeFailed
		}
		CGImageDestinationAddImage(dest, cgImage, [kCGImageDestinationLossyCompressionQuality as String: 0.8] as CFDictionary)
		guard CGImageDestinationFinalize(dest) else {
			throw ThumbnailStripError.jpegEncodeFailed
		}
		return ((data as Data).base64EncodedString(), cgImage.width, cgImage.height)
	}

	/// Resumes a continuation at most once. The timeout and the generator
	/// callback can both fire; a second `resume` traps.
	private final class OnceResume: @unchecked Sendable {
		private let lock = NSLock()
		private var done = false
		func run(_ body: () -> Void) {
			lock.lock()
			if done {
				lock.unlock()
				return
			}
			done = true
			lock.unlock()
			body()
		}
	}

	private static func writeJPEG(cgImage: CGImage, to url: URL) throws {
		guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
			throw ThumbnailStripError.jpegEncodeFailed
		}
		CGImageDestinationAddImage(dest, cgImage, [kCGImageDestinationLossyCompressionQuality as String: 0.8] as CFDictionary)
		guard CGImageDestinationFinalize(dest) else {
			throw ThumbnailStripError.jpegEncodeFailed
		}
	}
}
