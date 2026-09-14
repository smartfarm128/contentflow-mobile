import AVFoundation
import Foundation

/// ContentFlow — on-device text-to-speech for AI Director voiceovers.
///
/// Uses `AVSpeechSynthesizer.write(_:toBufferCallback:)`, which renders to
/// audio buffers WITHOUT playing through the speaker, so we can capture the
/// narration to a file and place it on the timeline as a real audio clip.
///
/// Why Apple Speech and not a cloud TTS: this app is local-first and free.
/// Apple's voices ship with the OS, work in airplane mode, cost nothing, and
/// need no API key — matching how transcription already works here
/// (`AppleSpeechTranscriber.swift`). A cloud voice would put a network call
/// and a billing account in front of a creator's basic voiceover.
///
/// The output is a 32-bit float WAV written into the app's media sandbox, so
/// the returned path is a normal native media handle the engine can import,
/// trim, duck and export like any other audio.
enum AppleSpeechSynthesizer {

	enum SynthesisError: CustomStringConvertible {
		case noVoiceAvailable(String)
		case writeFailed(String)

		var description: String {
			switch self {
			case .noVoiceAvailable(let lang):
				return "No installed system voice for language \(lang)."
			case .writeFailed(let detail):
				return "Could not render speech audio: \(detail)"
			}
		}
	}

	/// Lists the voices installed on this device, newest-quality first so the
	/// picker shows the best-sounding option at the top.
	static func availableVoices() -> [[String: Any]] {
		AVSpeechSynthesisVoice.speechVoices()
			.sorted { lhs, rhs in
				if lhs.quality.rawValue != rhs.quality.rawValue {
					return lhs.quality.rawValue > rhs.quality.rawValue
				}
				return lhs.name < rhs.name
			}
			.map { voice in
				[
					"id": voice.identifier,
					"name": voice.name,
					"language": voice.language,
					// premium/enhanced voices are the ones worth surfacing as
					// "HD" in the UI; default is the compact fallback voice.
					"quality": voice.quality == .premium
						? "premium"
						: (voice.quality == .enhanced ? "enhanced" : "standard"),
				]
			}
	}

	/// Renders `text` to a WAV inside `outputDirectory` and calls back with
	/// `{ audioUri, durationSec }`.
	static func synthesize(
		text: String,
		voiceId: String?,
		languageHint: String?,
		rate: Float,
		pitch: Float,
		outputDirectory: URL,
		completion: @escaping (Result<[String: Any], SynthesisError>) -> Void
	) {
		let utterance = AVSpeechUtterance(string: text)

		if let voiceId, let voice = AVSpeechSynthesisVoice(identifier: voiceId) {
			utterance.voice = voice
		} else {
			let lang = languageHint ?? AVSpeechSynthesisVoice.currentLanguageCode()
			guard let voice = AVSpeechSynthesisVoice(language: lang) else {
				completion(.failure(.noVoiceAvailable(lang)))
				return
			}
			utterance.voice = voice
		}

		// AVSpeechUtterance rate is 0...1 with 0.5 as natural speech, NOT a
		// plain multiplier — map the caller's 0.5x...2x multiplier onto it so
		// the UI can speak in multiples like every other speed control here.
		let normalized = AVSpeechUtteranceDefaultSpeechRate * max(0.5, min(2.0, rate))
		utterance.rate = max(AVSpeechUtteranceMinimumSpeechRate,
		                     min(AVSpeechUtteranceMaximumSpeechRate, normalized))
		utterance.pitchMultiplier = max(0.5, min(2.0, pitch))

		let synthesizer = AVSpeechSynthesizer()
		let fileName = "vo-\(UUID().uuidString).wav"
		let outputURL = outputDirectory.appendingPathComponent(fileName)

		do {
			try FileManager.default.createDirectory(
				at: outputDirectory, withIntermediateDirectories: true)
		} catch {
			completion(.failure(.writeFailed(error.localizedDescription)))
			return
		}

		var audioFile: AVAudioFile?
		var totalFrames: AVAudioFramePosition = 0
		var sampleRate: Double = 44_100
		var finished = false

		synthesizer.write(utterance) { buffer in
			guard let pcm = buffer as? AVAudioPCMBuffer else { return }
			// A zero-length buffer is the end-of-stream marker.
			if pcm.frameLength == 0 {
				guard !finished else { return }
				finished = true
				audioFile = nil // flush + close
				let duration = sampleRate > 0 ? Double(totalFrames) / sampleRate : 0
				completion(.success([
					"audioUri": outputURL.path,
					"durationSec": duration,
				]))
				return
			}

			do {
				if audioFile == nil {
					sampleRate = pcm.format.sampleRate
					audioFile = try AVAudioFile(
						forWriting: outputURL,
						settings: pcm.format.settings,
						commonFormat: pcm.format.commonFormat,
						interleaved: pcm.format.isInterleaved)
				}
				try audioFile?.write(from: pcm)
				totalFrames += AVAudioFramePosition(pcm.frameLength)
			} catch {
				guard !finished else { return }
				finished = true
				completion(.failure(.writeFailed(error.localizedDescription)))
			}
		}
	}
}
