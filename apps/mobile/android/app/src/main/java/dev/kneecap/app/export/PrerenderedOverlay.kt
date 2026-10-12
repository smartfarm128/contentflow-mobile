package dev.kneecap.app.export

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.media3.common.OverlaySettings
import androidx.media3.effect.BitmapOverlay
import androidx.media3.effect.StaticOverlaySettings

/**
 * Text/caption overlays rendered by the PREVIEW's own drawing code
 * (`editor-core/export/overlay-frames.ts`) and composited here verbatim —
 * the Android half of round 37.
 *
 * Android had the same structural problem iOS did: `EdlTextOverlay` is a
 * SECOND implementation of the editor's text rendering (Spannable +
 * `AbsoluteSizeSpan` at the RAW `fontSize` param, no height scaling, no
 * border, no line breaks, no caption word timing), so its exports could
 * never match the preview — the exact class of drift that cost iOS half a
 * dozen rounds to chase down one property at a time. Feeding it the
 * preview's own full-frame images removes that implementation from the
 * path instead of fixing it property by property.
 *
 * Each frame covers `[startUs, endUs)`. A frame is either an already-decoded
 * bitmap (short inline payloads) or a sandbox PNG path. Path frames are
 * decoded one at a time inside `getBitmap` so a 60s timeline does not hold
 * every bitmap in RAM. `BitmapOverlay` has no "inactive" notion, so outside
 * every frame's window this returns a 1×1 fully transparent bitmap.
 */
class PrerenderedOverlay(
    private val frames: List<Frame>,
    private val targetWidth: Int = 0,
    private val targetHeight: Int = 0,
) : BitmapOverlay() {

    data class Frame(
        val startUs: Long,
        val endUs: Long,
        val bitmap: Bitmap? = null,
        val pngPath: String? = null,
    )

    private val blank: Bitmap =
        Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888).apply { eraseColor(0) }

    /** The one decoded path frame Media3 may still be sampling. Dropping the
     *  reference is enough — recycling it here races the GL upload. */
    private var cachedPath: String? = null
    private var cachedBitmap: Bitmap? = null

    /** Full-frame, 1:1: the bitmap IS the output-resolution overlay layer,
     *  so it is anchored dead centre at scale 1 with no transform of its
     *  own. All positioning already happened in the preview's renderer. */
    private val settings: OverlaySettings =
        StaticOverlaySettings.Builder()
            .setBackgroundFrameAnchor(0.5f, 0.5f)
            .setOverlayFrameAnchor(0.5f, 0.5f)
            .build()

    override fun getBitmap(presentationTimeUs: Long): Bitmap {
        for (frame in frames) {
            if (presentationTimeUs >= frame.startUs && presentationTimeUs < frame.endUs) {
                return bitmapFor(frame)
            }
        }
        return blank
    }

    override fun getOverlaySettings(presentationTimeUs: Long): OverlaySettings = settings

    private fun bitmapFor(frame: Frame): Bitmap {
        frame.bitmap?.let { return it }
        val path = frame.pngPath
        if (path.isNullOrEmpty()) return blank
        if (path == cachedPath) {
            cachedBitmap?.let { return it }
        }
        val decoded = BitmapFactory.decodeFile(path) ?: return blank
        val fitted = fit(decoded)
        cachedPath = path
        cachedBitmap = fitted
        return fitted
    }

    /** Preview sometimes hands a 2x canvas. Media3 draws a BitmapOverlay at
     *  the bitmap's own pixel size, so scale to the export resolution. */
    private fun fit(bitmap: Bitmap): Bitmap {
        if (targetWidth <= 0 || targetHeight <= 0) return bitmap
        if (bitmap.width == targetWidth && bitmap.height == targetHeight) return bitmap
        val scaled = Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
        if (scaled !== bitmap) bitmap.recycle()
        return scaled
    }
}
