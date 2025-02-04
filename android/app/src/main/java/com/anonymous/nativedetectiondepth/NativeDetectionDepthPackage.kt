package com.anonymous.nativedetectiondepth

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NativeDetectionDepthPackage : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeDetectionDepthModule.NAME) {
      NativeDetectionDepthModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      NativeDetectionDepthModule.NAME to ReactModuleInfo(
        _name = NativeDetectionDepthModule.NAME,
        _className = NativeDetectionDepthModule.NAME,
        _canOverrideExistingModule = false,
        _needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true
      )
    )
  }
}
