package com.anonymous.nativecoapclient

import android.util.Log
import com.anonymous.seesafespecs.NativeCoapClientSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import kotlinx.coroutines.*
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.CoapResponse
import org.eclipse.californium.core.coap.MediaTypeRegistry

class NativeCoapClientModule(reactContext: ReactApplicationContext) :
  NativeCoapClientSpec(reactContext) {

  companion object {
    const val NAME = "NativeCoapClient"
  }

  private var timeout: Int = 5000
  private var maxRetries: Int = 3

  override fun getName() = NAME

  override fun setConfiguration(options: ReadableMap) {
    if (options.hasKey("timeout")) {
      timeout = options.getInt("timeout")
    }
    if (options.hasKey("maxRetries")) {
      maxRetries = options.getInt("maxRetries")
    }
  }

  override fun sendRequest(
    method: String,
    endpoint: String,
    isCritical: Boolean,
    payload: String?,
    promise: Promise
  ) {
    CoroutineScope(Dispatchers.IO).launch {
      try {
        val client = CoapClient(endpoint)
        client.timeout = timeout.toLong()

        val response: CoapResponse? = when (method.uppercase()) {
          "GET" -> client.get(MediaTypeRegistry.APPLICATION_JSON)
          "POST" -> client.post(payload, MediaTypeRegistry.APPLICATION_JSON)
          "PUT" -> client.put(payload, MediaTypeRegistry.APPLICATION_JSON)
          "DELETE" -> client.delete()
          else -> {
            promise.reject("ERROR", "Método inválido: $method")
            return@launch
          }
        }

        if (response != null) {
          promise.resolve(response.responseText)
        } else {
          if (isCritical) {
            promise.reject("ERROR", "Falha no envio da mensagem crítica.")
          } else {
            Log.w(NAME, "Falha no envio de mensagem não crítica.")
            promise.resolve(null)  // Retorna sucesso silencioso
          }
        }
      } catch (e: Exception) {
        Log.e(NAME, "Erro na requisição CoAP", e)
        if (isCritical) {
          promise.reject("ERROR", e.message)
        } else {
          promise.resolve(null)  // Retorna sucesso silencioso
        }
      }
    }
  }

}
