package dev.kneecap.app.export

import androidx.media3.common.Effect
import androidx.media3.effect.RgbMatrix
import dev.kneecap.app.edl.EdlClip
import dev.kneecap.app.edl.EdlEffect

/**
 * Media3 RGB matrix for the preview's `color-adjust` pass.
 *
 * The product is the same column-major 4×4 as `shaderGradeMatrix` in
 * `packages/editor-core/src/effects/grade.ts` (temperature, brightness,
 * contrast, saturation). Sharpen, vignette, blur, and masks are spatial;
 * this class does not claim them. Brightness effects use the same bias the
 * iOS compositor passes to `CIColorControls.inputBrightness`.
 */
internal class ShaderGradeMatrix(
    private val matrix: FloatArray,
) : RgbMatrix {
    override fun getMatrix(presentationTimeUs: Long, useHdr: Boolean): FloatArray = matrix
}

internal object ColorGradeEffects {
    private val rendered = setOf("adjust", "brightness", "filter")

    fun renderedTypes(): Set<String> = rendered

    fun effectsFor(clip: EdlClip): List<Effect> {
        val effects = mutableListOf<Effect>()
        for (effect in clip.effects) {
            if (!effect.enabled || effect.type !in rendered) continue
            val matrix = matrixFor(effect) ?: continue
            effects.add(ShaderGradeMatrix(matrix))
        }
        return effects
    }

    private fun matrixFor(effect: EdlEffect): FloatArray? {
        return when (effect.type) {
            "brightness" -> {
                val amount = number(effect.params, "amount")
                if (amount == 0.0) null else translation(amount, amount, amount)
            }
            "filter" -> filterMatrix(effect.params)
            "adjust" -> adjustMatrix(effect.params)
            else -> null
        }
    }

    private fun adjustMatrix(params: Map<String, Any?>): FloatArray? {
        val brightness = (number(params, "brightness") / 100.0) * 0.35
        val contrast = 1.0 + (number(params, "contrast") / 100.0) * 0.6
        val saturation = kotlin.math.max(0.0, 1.0 + number(params, "saturation") / 100.0)
        val temperature = number(params, "temperature") / 100.0
        val tint = number(params, "tint") / 100.0
        if (
            brightness == 0.0 && contrast == 1.0 && saturation == 1.0 &&
            temperature == 0.0 && tint == 0.0
        ) {
            return null
        }
        return shaderGradeMatrix(brightness, contrast, saturation, temperature, tint)
    }

    private fun filterMatrix(params: Map<String, Any?>): FloatArray? {
        val preset = params["preset"] as? String ?: "none"
        val target = FILTER_PRESETS[preset] ?: return null
        val mix = (
            if (params.containsKey("intensity")) number(params, "intensity") else 100.0
            ).coerceIn(0.0, 100.0) / 100.0
        if (mix == 0.0) return null
        return shaderGradeMatrix(
            brightness = target[0] * mix,
            contrast = 1.0 + (target[1] - 1.0) * mix,
            saturation = 1.0 + (target[2] - 1.0) * mix,
            temperature = target[3] * mix,
            tint = target[4] * mix,
        )
    }

    /** brightness, contrast, saturation, temperature, tint at intensity 1. */
    private val FILTER_PRESETS = mapOf(
        "vivid" to doubleArrayOf(0.03, 1.15, 1.35, 0.08, 0.0),
        "mono" to doubleArrayOf(0.0, 1.08, 0.0, 0.0, 0.0),
        "vintage" to doubleArrayOf(0.04, 0.92, 0.62, 0.55, 0.12),
        "cool" to doubleArrayOf(0.0, 1.06, 0.92, -0.72, 0.08),
        "warm" to doubleArrayOf(0.03, 1.05, 1.08, 0.62, -0.06),
        "cinematic" to doubleArrayOf(-0.03, 1.2, 0.78, -0.22, 0.1),
    )

    fun shaderGradeMatrix(
        brightness: Double,
        contrast: Double,
        saturation: Double,
        temperature: Double,
        tint: Double,
    ): FloatArray {
        val temp = translation(
            temperature * 0.12 + tint * 0.05,
            -tint * 0.10,
            -temperature * 0.12 + tint * 0.05,
        )
        val bright = translation(brightness, brightness, brightness)
        val bias = 0.5 - 0.5 * contrast
        val contrastM = floatArrayOf(
            contrast.toFloat(), 0f, 0f, 0f,
            0f, contrast.toFloat(), 0f, 0f,
            0f, 0f, contrast.toFloat(), 0f,
            bias.toFloat(), bias.toFloat(), bias.toFloat(), 1f,
        )
        val inv = 1.0 - saturation
        val sat = saturation
        val rw = 0.2126
        val gw = 0.7152
        val bw = 0.0722
        val saturationM = floatArrayOf(
            (sat + inv * rw).toFloat(), (inv * rw).toFloat(), (inv * rw).toFloat(), 0f,
            (inv * gw).toFloat(), (sat + inv * gw).toFloat(), (inv * gw).toFloat(), 0f,
            (inv * bw).toFloat(), (inv * bw).toFloat(), (sat + inv * bw).toFloat(), 0f,
            0f, 0f, 0f, 1f,
        )
        return matMul(saturationM, matMul(contrastM, matMul(bright, temp)))
    }

    private fun translation(x: Double, y: Double, z: Double): FloatArray = floatArrayOf(
        1f, 0f, 0f, 0f,
        0f, 1f, 0f, 0f,
        0f, 0f, 1f, 0f,
        x.toFloat(), y.toFloat(), z.toFloat(), 1f,
    )

    private fun matMul(a: FloatArray, b: FloatArray): FloatArray {
        val out = FloatArray(16)
        for (col in 0 until 4) {
            for (row in 0 until 4) {
                var sum = 0f
                for (k in 0 until 4) {
                    sum += a[k * 4 + row] * b[col * 4 + k]
                }
                out[col * 4 + row] = sum
            }
        }
        return out
    }

    private fun number(params: Map<String, Any?>, key: String): Double {
        return when (val value = params[key]) {
            is Number -> value.toDouble()
            is String -> value.toDoubleOrNull() ?: 0.0
            else -> 0.0
        }
    }
}
