package com.anonymous.nativebooleantest

import android.content.Context
import com.anonymous.seesafespecs.NativeBooleanTestSpec
import com.facebook.react.bridge.ReactApplicationContext

class NativeBooleanTestModule(reactContext: ReactApplicationContext) :
  NativeBooleanTestSpec(reactContext) {

  override fun getName() = NAME

  override fun getValue(): Boolean {
    // Exemplo de lógica para retornar um valor booleano
    return true  // Aqui você pode substituir a lógica para obter o valor booleano desejado
  }

  companion object {
    const val NAME = "NativeBooleanTest"
  }
}
  