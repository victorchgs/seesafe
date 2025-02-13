package com.anonymous.nativecamerax

import android.util.Base64
import android.util.Log
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.anonymous.seesafespecs.NativeCameraXSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import android.graphics.ImageFormat
import android.graphics.YuvImage
import android.graphics.Rect
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.core.CameraSelector
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner


class NativeCameraXModule(reactContext: ReactApplicationContext) : NativeCameraXSpec(reactContext) {

    companion object {
        const val NAME = "NativeCameraX"
    }

    override fun getName() = NAME

    override fun captureImage(promise: Promise) {
        try {
            val cameraProviderFuture = ProcessCameraProvider.getInstance(reactApplicationContext)

            cameraProviderFuture.addListener({
                val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
                val imageAnalysis = ImageAnalysis.Builder().build().also {
                    it.setAnalyzer(ContextCompat.getMainExecutor(reactApplicationContext), ImageAnalysis.Analyzer { image ->
                        Log.d(NAME, "Analisando imagem...")
                        val base64Image = imageToBase64(image)
                        image.close()
                        if (base64Image != null) {
                            promise.resolve(base64Image)
                        } else {
                            promise.reject("ERROR", "Falha ao converter imagem")
                        }
                    })
                }

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                cameraProvider.bindToLifecycle(
                    reactApplicationContext.currentActivity as LifecycleOwner,
                    cameraSelector,
                    imageAnalysis
                )
            }, ContextCompat.getMainExecutor(reactApplicationContext))

        } catch (e: Exception) {
            Log.e(NAME, "Erro ao capturar imagem", e)
            promise.reject("ERROR", e.message)
        }
    }


    private fun imageToBase64(image: ImageProxy): String? {
        return try {
            val yuvBytes = yuv420ToNv21(image)
            val yuvImage = YuvImage(yuvBytes, ImageFormat.NV21, image.width, image.height, null)
            val outputStream = ByteArrayOutputStream()
            yuvImage.compressToJpeg(Rect(0, 0, image.width, image.height), 100, outputStream)
            val byteArray = outputStream.toByteArray()
            Base64.encodeToString(byteArray, Base64.DEFAULT)
        } catch (e: Exception) {
            Log.e(NAME, "Erro ao converter imagem", e)
            null
        }
    }

    private fun yuv420ToNv21(image: ImageProxy): ByteArray {
        val yBuffer = image.planes[0].buffer
        val vuBuffer = image.planes[2].buffer

        val ySize = yBuffer.remaining()
        val vuSize = vuBuffer.remaining()

        val nv21 = ByteArray(ySize + vuSize)

        yBuffer.get(nv21, 0, ySize)
        vuBuffer.get(nv21, ySize, vuSize)

        return nv21
    }
}
