package dev.kneecap.app

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import java.io.File
import java.util.Locale
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

/**
 * ContentFlow — on-device text-to-speech for AI Director voiceovers.
 *
 * Mirrors iOS's `AppleSpeechSynthesizer.swift`: renders narration to a WAV in
 * the app's media custody directory so it can be imported as a real timeline
 * audio clip, rather than played straight out of the speaker.
 *
 * Android's `TextToSpeech.synthesizeToFile` already writes a RIFF/WAV, so no
 * container work is needed here. Engine init is async and one-shot per call —
 * the engine is shut down in every terminal path so a failed render can't leak
 * a live TTS service.
 */
object SpeechSynthesizer {

    data class SynthesisResult(val audioUri: String, val durationSec: Double)

    /** Thrown states are surfaced to JS as native-bridge error codes. */
    class UnsupportedException(message: String) : Exception(message)
    class IoException(message: String) : Exception(message)

    fun listVoices(context: Context, onResult: (List<Map<String, Any>>) -> Unit) {
        var tts: TextToSpeech? = null
        tts = TextToSpeech(context) { status ->
            if (status != TextToSpeech.SUCCESS) {
                tts?.shutdown()
                onResult(emptyList())
                return@TextToSpeech
            }
            val voices: Set<Voice> = try {
                tts?.voices ?: emptySet()
            } catch (e: Exception) {
                emptySet()
            }
            val mapped = voices
                // Network-only voices would break the offline guarantee, so
                // they are filtered out rather than offered and then failing.
                .filter { !it.isNetworkConnectionRequired }
                .sortedWith(compareByDescending<Voice> { it.quality }.thenBy { it.name })
                .map { v ->
                    mapOf(
                        "id" to v.name,
                        "name" to prettyName(v),
                        "language" to v.locale.toLanguageTag(),
                        "quality" to when {
                            v.quality >= Voice.QUALITY_VERY_HIGH -> "premium"
                            v.quality >= Voice.QUALITY_HIGH -> "enhanced"
                            else -> "standard"
                        },
                    )
                }
            tts?.shutdown()
            onResult(mapped)
        }
    }

    /** Android voice names are opaque ids like "en-us-x-sfg#male_1-local". */
    private fun prettyName(v: Voice): String {
        val display = v.locale.displayName
        val variant = v.name.substringAfterLast('#', "").substringBefore('-')
        return if (variant.isNotEmpty()) "$display (${variant.replaceFirstChar { it.uppercase() }})"
        else display
    }

    fun synthesize(
        context: Context,
        text: String,
        voiceId: String?,
        languageHint: String?,
        rate: Float,
        pitch: Float,
        outputDirectory: File,
        onSuccess: (SynthesisResult) -> Unit,
        onError: (Exception) -> Unit,
    ) {
        if (!outputDirectory.exists() && !outputDirectory.mkdirs()) {
            onError(IoException("Could not create media directory"))
            return
        }
        val outFile = File(outputDirectory, "vo-${UUID.randomUUID()}.wav")
        val utteranceId = UUID.randomUUID().toString()
        val settled = AtomicBoolean(false)

        var tts: TextToSpeech? = null
        tts = TextToSpeech(context) { status ->
            if (status != TextToSpeech.SUCCESS) {
                if (settled.compareAndSet(false, true)) {
                    tts?.shutdown()
                    onError(UnsupportedException("No text-to-speech engine available on this device."))
                }
                return@TextToSpeech
            }

            val engine = tts ?: return@TextToSpeech

            val locale = languageHint?.let { Locale.forLanguageTag(it) } ?: Locale.getDefault()
            val langStatus = engine.setLanguage(locale)
            if (langStatus == TextToSpeech.LANG_MISSING_DATA || langStatus == TextToSpeech.LANG_NOT_SUPPORTED) {
                if (settled.compareAndSet(false, true)) {
                    engine.shutdown()
                    onError(UnsupportedException("No installed voice for language ${locale.toLanguageTag()}."))
                }
                return@TextToSpeech
            }

            if (voiceId != null) {
                engine.voices?.firstOrNull { it.name == voiceId }?.let { engine.voice = it }
            }
            engine.setSpeechRate(rate.coerceIn(0.5f, 2.0f))
            engine.setPitch(pitch.coerceIn(0.5f, 2.0f))

            engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(id: String?) {}

                override fun onDone(id: String?) {
                    if (!settled.compareAndSet(false, true)) return
                    engine.shutdown()
                    if (!outFile.exists() || outFile.length() == 0L) {
                        onError(IoException("Speech render produced no audio."))
                        return
                    }
                    onSuccess(SynthesisResult(outFile.absolutePath, estimateWavDuration(outFile)))
                }

                @Deprecated("Required by the base class for API < 21 parity")
                override fun onError(id: String?) {
                    if (!settled.compareAndSet(false, true)) return
                    engine.shutdown()
                    onError(IoException("Speech synthesis failed."))
                }

                override fun onError(id: String?, errorCode: Int) {
                    if (!settled.compareAndSet(false, true)) return
                    engine.shutdown()
                    onError(IoException("Speech synthesis failed (code $errorCode)."))
                }
            })

            val result = engine.synthesizeToFile(text, null, outFile, utteranceId)
            if (result != TextToSpeech.SUCCESS && settled.compareAndSet(false, true)) {
                engine.shutdown()
                onError(IoException("Could not start speech synthesis."))
            }
        }
    }

    /**
     * Duration from the WAV header: bytes of PCM data / byte-rate. Reading the
     * header avoids pulling in a decoder for a file we just wrote ourselves.
     */
    private fun estimateWavDuration(file: File): Double {
        return try {
            file.inputStream().use { stream ->
                val header = ByteArray(44)
                if (stream.read(header) < 44) return 0.0
                fun le32(o: Int) = (header[o].toInt() and 0xFF) or
                    ((header[o + 1].toInt() and 0xFF) shl 8) or
                    ((header[o + 2].toInt() and 0xFF) shl 16) or
                    ((header[o + 3].toInt() and 0xFF) shl 24)
                val byteRate = le32(28)
                if (byteRate <= 0) return 0.0
                (file.length() - 44).coerceAtLeast(0L).toDouble() / byteRate.toDouble()
            }
        } catch (e: Exception) {
            0.0
        }
    }
}
