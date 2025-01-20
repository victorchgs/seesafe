package com.anonymous.nativecoapclient

import com.anonymous.seesafespecs.NativeCoapClientSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.eclipse.californium.core.CoapClient
import org.eclipse.californium.core.CoapResponse
import org.eclipse.californium.core.coap.MediaTypeRegistry
import org.json.JSONObject

class NativeCoapClientModule(reactContext: ReactApplicationContext) :
  NativeCoapClientSpec(reactContext) {

  override fun getName() = NAME

  override fun sendCoapRequest(method: String, uri: String, payload: String?, promise: Promise) {
    CoroutineScope(Dispatchers.IO).launch {
      try {
        val client = CoapClient(uri)
        val response: CoapResponse? = when (method.uppercase()) {
          "POST" -> client.post(payload, MediaTypeRegistry.APPLICATION_JSON)
          "PUT" -> client.put(payload, MediaTypeRegistry.APPLICATION_JSON)
          "GET" -> client.get()
          "DELETE" -> client.delete()
          else -> {
            promise.reject("INVALID_METHOD", "Método HTTP não suportado: $method")
            return@launch
          }
        }

        withContext(Dispatchers.Main) {
          if (response != null) {
            promise.resolve(response.responseText)
          } else {
            promise.reject("COAP_ERROR", "Erro na requisição CoAP: ${response?.code}")
          }
        }
      } catch (e: Exception) {
        withContext(Dispatchers.Main) {
          promise.reject("COAP_EXCEPTION", e.message)
        }
      }
    }
  }

  companion object {
    const val NAME = "NativeCoapClient"
  }
}
