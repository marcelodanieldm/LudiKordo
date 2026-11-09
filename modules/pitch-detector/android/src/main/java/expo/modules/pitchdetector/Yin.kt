package expo.modules.pitchdetector

/**
 * YIN (de Cheveigné y Kawahara, 2002). Misma implementación que src/music/yin.ts,
 * que tiene las pruebas automáticas. Si se cambia una, cambiar la otra.
 */
class Yin(
  private val sampleRate: Int,
  private val windowSize: Int,
  private val threshold: Float,
  minFreq: Float = 35f,
  maxFreq: Float = 450f,
) {
  private val maxTau = minOf((sampleRate / minFreq).toInt(), windowSize / 2)
  private val minTau = maxOf(2, (sampleRate / maxFreq).toInt())
  private val diff = FloatArray(maxTau + 1)
  private val cmnd = FloatArray(maxTau + 1)

  data class Result(val freq: Float, val clarity: Float)

  fun detect(buffer: FloatArray): Result? {
    val w = buffer.size - maxTau
    if (w <= 0) return null

    for (tau in 1..maxTau) {
      var sum = 0f
      for (i in 0 until w) {
        val d = buffer[i] - buffer[i + tau]
        sum += d * d
      }
      diff[tau] = sum
    }

    cmnd[0] = 1f
    var running = 0f
    for (tau in 1..maxTau) {
      running += diff[tau]
      cmnd[tau] = if (running == 0f) 1f else diff[tau] * tau / running
    }

    var tauEst = -1
    var tau = minTau
    while (tau <= maxTau) {
      if (cmnd[tau] < threshold) {
        while (tau + 1 <= maxTau && cmnd[tau + 1] < cmnd[tau]) tau++
        tauEst = tau
        break
      }
      tau++
    }
    if (tauEst == -1) return null

    var better = tauEst.toFloat()
    if (tauEst in 2 until maxTau) {
      val s0 = cmnd[tauEst - 1]
      val s1 = cmnd[tauEst]
      val s2 = cmnd[tauEst + 1]
      val denom = 2f * (2f * s1 - s2 - s0)
      if (denom != 0f) better = tauEst + (s2 - s0) / denom
    }
    return Result(sampleRate / better, (1f - cmnd[tauEst]).coerceIn(0f, 1f))
  }
}
