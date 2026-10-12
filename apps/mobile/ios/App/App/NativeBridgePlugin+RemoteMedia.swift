import Foundation
import Capacitor

/// Downloads a remote media file (Pexels GET, ElevenLabs POST) or copies a
/// `file://` URL into `MediaSandbox`, then probes it the same way `pickMedia`
/// does. The handle's `uri` is a raw sandbox path so export and a later
/// relaunch can open it.
extension NativeBridgePlugin {

	@objc func importRemoteMedia(_ call: CAPPluginCall) {
		guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
			call.reject("importRemoteMedia requires a url", "IO_ERROR")
			return
		}
		let kind = call.getString("kind") ?? "video"
		let fileName = call.getString("fileName") ?? "media"
		let method = (call.getString("method") ?? "GET").uppercased()
		let body = call.getString("body")
		var headers: [String: String] = [:]
		if let raw = call.getObject("headers") {
			for (key, value) in raw {
				if let text = value as? String {
					headers[key] = text
				}
			}
		}

		let scheme = (url.scheme ?? "").lowercased()
		guard scheme == "https" || scheme == "http" || scheme == "file" else {
			call.reject("importRemoteMedia only accepts https, http, or file URLs", "IO_ERROR")
			return
		}
		guard method == "GET" || method == "POST" else {
			call.reject("importRemoteMedia method must be GET or POST", "IO_ERROR")
			return
		}

		Task {
			do {
				let localURL = try await Self.fetchRemoteMedia(
					url: url,
					method: method,
					headers: headers,
					body: body
				)
				let ext = Self.mediaExtension(url: localURL, fileName: fileName, kind: kind)
				let assetId = UUID().uuidString
				let custodyURL = try MediaSandbox.copyIntoMediaCustody(
					sourceURL: localURL,
					assetId: assetId,
					fileExtension: ext
				)
				if !url.isFileURL {
					try? FileManager.default.removeItem(at: localURL)
				}

				if kind == "image" {
					let attrs = try? FileManager.default.attributesOfItem(atPath: custodyURL.path)
					let sizeBytes = (attrs?[.size] as? Int) ?? 0
					call.resolve([
						"id": assetId,
						"uri": custodyURL.path,
						"kind": "image",
						"fileName": fileName,
						"sizeBytes": sizeBytes,
						"durationMicros": 0,
						"width": 0,
						"height": 0,
						"rotationDegrees": 0,
						"hasAudio": false,
						"codec": ext,
						"frameRate": NSNull(),
					])
					return
				}

				let probed: ProbedMedia
				do {
					probed = try await MediaProbe.probe(url: custodyURL)
				} catch {
					try? FileManager.default.removeItem(at: custodyURL)
					call.reject("probe failed — unsupported or corrupt media", "IO_ERROR")
					return
				}
				let attrs = try? FileManager.default.attributesOfItem(atPath: custodyURL.path)
				let sizeBytes = (attrs?[.size] as? Int) ?? 0
				var frameRate: Any = NSNull()
				if let num = probed.frameRateNumerator, let den = probed.frameRateDenominator {
					frameRate = ["numerator": num, "denominator": den]
				}
				call.resolve([
					"id": assetId,
					"uri": custodyURL.path,
					"kind": probed.kind,
					"fileName": fileName,
					"sizeBytes": sizeBytes,
					"durationMicros": probed.durationMicros,
					"width": probed.width,
					"height": probed.height,
					"rotationDegrees": probed.rotationDegrees,
					"hasAudio": probed.hasAudio,
					"codec": probed.codec,
					"frameRate": frameRate,
				])
			} catch {
				call.reject(error.localizedDescription, "IO_ERROR")
			}
		}
	}

	/// `file://` is copied as-is (the autotest fixture). https/http is a
	/// streamed download; the temp file is what `copyIntoMediaCustody` reads.
	private static func fetchRemoteMedia(
		url: URL,
		method: String,
		headers: [String: String],
		body: String?
	) async throws -> URL {
		if url.isFileURL {
			guard FileManager.default.fileExists(atPath: url.path) else {
				throw RemoteMediaError.message("no file at \(url.path)")
			}
			return url
		}
		var request = URLRequest(url: url)
		request.httpMethod = method
		request.timeoutInterval = 120
		for (key, value) in headers {
			request.setValue(value, forHTTPHeaderField: key)
		}
		if method == "POST", let body {
			request.httpBody = Data(body.utf8)
		}
		let (tempURL, response) = try await URLSession.shared.download(for: request)
		if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
			try? FileManager.default.removeItem(at: tempURL)
			throw RemoteMediaError.message("download failed: \(http.statusCode)")
		}
		return tempURL
	}

	private static func mediaExtension(url: URL, fileName: String, kind: String) -> String {
		let fromFile = (fileName as NSString).pathExtension
		if !fromFile.isEmpty && fromFile.count <= 5 { return fromFile.lowercased() }
		let fromURL = url.pathExtension
		if !fromURL.isEmpty && fromURL.count <= 5 { return fromURL.lowercased() }
		switch kind {
		case "audio": return "mp3"
		case "image": return "jpg"
		default: return "mp4"
		}
	}
}

private enum RemoteMediaError: LocalizedError {
	case message(String)
	var errorDescription: String? {
		switch self {
		case .message(let text): return text
		}
	}
}
