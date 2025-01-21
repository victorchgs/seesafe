package com.anonymous.nativedepthestimation

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.facebook.react.bridge.ReactApplicationContext
import com.anonymous.seesafespecs.NativeDepthEstimationSpec
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import org.tensorflow.lite.Interpreter
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel
import android.util.Base64
import android.util.Log

class NativeDepthEstimationModule(reactContext: ReactApplicationContext) :
  NativeDepthEstimationSpec(reactContext) {

    private lateinit var interpreter: Interpreter

    override fun getName() = NAME

    init {
        val modelPath = "midas.tflite"
        interpreter = Interpreter(loadModelFile(reactContext, modelPath))
        interpreter.allocateTensors()
    }

    override fun getDepthMap(base64Image: String, promise: Promise) {
        try {
            val inputImage = decodeBase64Image(base64Image)
            if (inputImage == null) {
                promise.reject("ERROR", "Falha ao decodificar a imagem Base64")
                return
            }
            val processedImage = preprocessImage(inputImage)
            val outputBuffer = Array(1) { Array(256) { Array(256) { FloatArray(1) } } }
            interpreter.run(processedImage, outputBuffer)

            val depthMap = Array(256) { row ->
                FloatArray(256) { col ->
                    outputBuffer[0][row][col][0]
                }
            }

            // Convertendo o depthMap para JSON
            val depthMapJson = depthMap.joinToString(separator = ",", prefix = "[", postfix = "]") { row ->
                row.joinToString(separator = ",", prefix = "[", postfix = "]")
            }
            
            promise.resolve(depthMapJson)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun loadModelFile(context: Context, modelPath: String): ByteBuffer {
        val assetFileDescriptor = context.assets.openFd(modelPath)
        val inputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    private fun decodeBase64Image(base64Image: String): Bitmap? {
        val decodedBytes = Base64.decode(base64Image, Base64.DEFAULT)
        val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
        if (bitmap == null) {
            Log.e("NativeDepthEstimation", "Falha ao decodificar a imagem Base64")
            throw IllegalArgumentException("Falha ao decodificar a imagem Base64")
        }
        return bitmap
    }

    private fun preprocessImage(bitmap: Bitmap): ByteBuffer {
        val resizedBitmap = Bitmap.createScaledBitmap(bitmap, 256, 256, true)
        val byteBuffer = ByteBuffer.allocateDirect(1 * 256 * 256 * 3 * 4)
        byteBuffer.order(ByteOrder.nativeOrder())
        val intValues = IntArray(256 * 256)
        resizedBitmap.getPixels(intValues, 0, 256, 0, 0, 256, 256)

        for (i in 0 until 256 * 256) {
            val `val` = intValues[i]
            val r = ((`val` shr 16) and 0xFF) / 255.0f
            val g = ((`val` shr 8) and 0xFF) / 255.0f
            val b = ((`val` and 0xFF)) / 255.0f
            byteBuffer.putFloat(r)
            byteBuffer.putFloat(g)
            byteBuffer.putFloat(b)
        }

        Log.d("NativeDepthEstimation", "Imagem processada e buffer preparado")
        return byteBuffer
    }

    companion object {
        const val NAME = "NativeDepthEstimation"
    }
}

