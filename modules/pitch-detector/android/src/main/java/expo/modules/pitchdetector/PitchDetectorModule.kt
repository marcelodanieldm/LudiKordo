package expo.modules.pitchdetector

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlin.concurrent.thread
import kotlin.math.sqrt

class StartOptions : Record {
  @Field val sampleRate: Int = 44100
  @Field val bufferSize: Int = 4096
  @Field val hopSize: Int = 1024
  @Field val threshold: Double = 0.15
}

/**
 * Escucha el micrófono y emite:
 * - onPitch: altura cuadro a cuadro (afinador).
 * - onNote: un evento por ataque, cuando la energía sube de golpe y la altura se estabiliza.
 * - onLevel: nivel RMS, para avisar si hay mucho ruido.
 * El tiempo se cuenta en muestras leídas, así no depende del reloj del sistema.
 */
class PitchDetectorModule : Module() {
  @Volatile private var running = false
  private var worker: Thread? = null

  override fun definition() = ModuleDefinition {
    Name("PitchDetector")
    Events("onNote", "onPitch", "onLevel")

    AsyncFunction("start") { options: StartOptions ->
      startListening(options)
    }

    Function("stop") {
      stopListening()
    }

    OnDestroy {
      stopListening()
    }
  }

  @SuppressLint("MissingPermission") // el permiso se pide en JavaScript antes de llamar a start()
  private fun startListening(o: StartOptions) {
    stopListening()
    val minBuf = AudioRecord.getMinBufferSize(o.sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_FLOAT)
    val record = AudioRecord(
      // VOICE_RECOGNITION evita el control automático de ganancia y la mayor parte del procesamiento.
      MediaRecorder.AudioSource.VOICE_RECOGNITION,
      o.sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_FLOAT,
      maxOf(minBuf, o.hopSize * 4 * 4),
    )
    if (record.state != AudioRecord.STATE_INITIALIZED) {
      record.release()
      throw IllegalStateException("No se pudo abrir el micrófono")
    }

    running = true
    record.startRecording()
    worker = thread(name = "PitchDetector") {
      val yin = Yin(o.sampleRate, o.bufferSize, o.threshold.toFloat())
      val window = FloatArray(o.bufferSize)
      val hop = FloatArray(o.hopSize)
      var samples = 0L
      var prevRms = 0f
      var pendingOnsetMs = -1.0
      var framesSinceOnset = 0
      try {
        while (running) {
          val n = record.read(hop, 0, hop.size, AudioRecord.READ_BLOCKING)
          if (n <= 0) continue
          System.arraycopy(window, n, window, 0, window.size - n)
          System.arraycopy(hop, 0, window, window.size - n, n)
          samples += n

          var sum = 0f
          for (i in 0 until n) sum += hop[i] * hop[i]
          val rms = sqrt(sum / n)
          val nowMs = samples * 1000.0 / o.sampleRate
          sendEvent("onLevel", mapOf("rms" to rms))

          // Ataque: la energía sube al menos 1,8 veces por encima de un piso de ruido.
          if (rms > 0.01f && rms > prevRms * 1.8f) {
            pendingOnsetMs = nowMs - n * 1000.0 / o.sampleRate
            framesSinceOnset = 0
          }
          prevRms = rms * 0.7f + prevRms * 0.3f

          val res = if (rms > 0.005f) yin.detect(window) else null
          if (res != null && res.clarity > 0.8f) {
            sendEvent("onPitch", mapOf("freq" to res.freq, "elapsedMs" to nowMs, "clarity" to res.clarity))
          }
          if (pendingOnsetMs >= 0) {
            framesSinceOnset++
            if (res != null && res.clarity > 0.85f) {
              sendEvent("onNote", mapOf("freq" to res.freq, "elapsedMs" to pendingOnsetMs, "clarity" to res.clarity))
              pendingOnsetMs = -1.0
            } else if (framesSinceOnset > 4) {
              pendingOnsetMs = -1.0 // ataque sin altura clara: probablemente un golpe o ruido
            }
          }
        }
      } finally {
        record.stop()
        record.release()
      }
    }
  }

  private fun stopListening() {
    running = false
    worker?.join(500)
    worker = null
  }
}
