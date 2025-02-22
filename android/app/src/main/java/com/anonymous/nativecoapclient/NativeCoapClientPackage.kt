package com.anonymous.nativecoapclient

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NativeCoapClientPackage : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeCoapClientModule.NAME) {
      NativeCoapClientModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      NativeCoapClientModule.NAME to ReactModuleInfo(
        name = NativeCoapClientModule.NAME,
        className = NativeCoapClientModule::class.java.name,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        hasConstants = true,
        isCxxModule = false,
        isTurboModule = true
      )
    )
  }
}
