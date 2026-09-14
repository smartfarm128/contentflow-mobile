import Foundation
import Capacitor

/// ContentFlow — the `speak` / `listVoices` plugin methods, Capacitor glue
/// over `NativeMedia/AppleSpeechSynthesizer.swift` (which holds the synthesis
/// logic so it stays testable without Capacitor, mirroring how
/// `NativeBridgePlugin+Transcribe.swift` sits over `AppleSpeechTranscriber`).
///
/// Error-code mapping follows `NATIVE_BRIDGE_ERROR_CODES`
/// (packages/native-bridge/src/types.ts): a missing system voice is
/// UNSUPPORTED, anything file/IO-ish is IO_ERROR. The TS bridge preserves
/// these codes verbatim (`toNativeBridgeError`).
extension NativeBridgePlugin {

	@objc func listVoices(_ call: CAPPluginCall) {
		call.resolve(["voices": AppleSpeechSynthesizer.availableVoices()])
	}

	@objc func speak(_ call: CAPPluginCall) {
		guard let text = call.getString("text"), !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
			call.reject("speak requires non-empty text", "IO_ERROR")
			return
		}

		let voiceId = call.getString("voiceId")
		let languageHint = call.getString("languageHint")
		let rate = Float(call.getDouble("rate") ?? 1.0)
		let pitch = Float(call.getDouble("pitch") ?? 1.0)

		let outputDirectory: URL
		do {
			// Voiceovers live in normal media custody: the resulting file is
			// imported as a real audio asset, so it must survive alongside
			// every other clip the project references.
			outputDirectory = try MediaSandbox.mediaDirectory()
		} catch {
			call.reject("Could not open media directory: \(error.localizedDescription)", "IO_ERROR")
			return
		}

		AppleSpeechSynthesizer.synthesize(
			text: text,
			voiceId: voiceId,
			languageHint: languageHint,
			rate: rate,
			pitch: pitch,
			outputDirectory: outputDirectory
		) { result in
			switch result {
			case .success(let payload):
				if let path = payload["audioUri"] as? String {
					MediaSandbox.excludeFromBackup(URL(fileURLWithPath: path))
				}
				call.resolve(payload)
			case .failure(let error):
				switch error {
				case .noVoiceAvailable:
					call.reject(error.description, "UNSUPPORTED")
				case .writeFailed:
					call.reject(error.description, "IO_ERROR")
				}
			}
		}
	}
}
