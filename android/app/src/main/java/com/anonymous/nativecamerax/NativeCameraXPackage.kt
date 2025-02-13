package com.anonymous.nativecamerax

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NativeCameraXPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        if (name == NativeCameraXModule.NAME) {
            NativeCameraXModule(reactContext)
        } else {
            null
        }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            NativeCameraXModule.NAME to ReactModuleInfo(
                name = NativeCameraXModule.NAME,
                className = NativeCameraXModule::class.java.name,
                canOverrideExistingModule = false,
                needsEagerInit = false,
                hasConstants = true,
                isCxxModule = false,
                isTurboModule = true
            )
        )
    }
}