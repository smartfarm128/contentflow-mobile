package dev.kneecap.app.export

/**
 * The one function that crosses `EdlMeta.ticksPerSecond`-relative ticks into
 * Media3's microsecond (`Us`) time base. Integer math only — plan §2.2/§2.3
 * rule 1 ("no floats cross the bridge") extends one hop further here: ticks
 * come in as `Long`, microseconds go out as `Long`, and the only place a
 * fraction could sneak in (`ticks * 1_000_000 / ticksPerSecond`) is exact
 * integer division, not a `Double` cast.
 */
fun ticksToUs(ticks: Long, ticksPerSecond: Long): Long {
    require(ticksPerSecond > 0) { "ticksPerSecond must be > 0, got $ticksPerSecond" }
    return Math.multiplyExact(ticks, 1_000_000L) / ticksPerSecond
}

/** Thrown for a document the exporter cannot time at all (no main track, a
 * transition that does not fit its neighbours). Unsupported features —
 * masks, filters, templates, blob assets — are skipped, not thrown; the
 * export sheet lists those before the encode starts. */
class ExportUnsupportedException(message: String) : Exception(message)
