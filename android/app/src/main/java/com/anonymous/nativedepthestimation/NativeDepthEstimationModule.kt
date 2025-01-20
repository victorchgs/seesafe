package com.anonymous.nativebooleantest

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import org.tensorflow.lite.Interpreter
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel


class NativeDepthEstimationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private lateinit var interpreter: Interpreter

    override fun getName() = NAME

    init {
        // Inicializar o modelo TFLite
        val modelPath = "midas.tflite" // Nome do modelo na pasta assets
        interpreter = Interpreter(loadModelFile(reactContext, modelPath))
    }

    @ReactMethod
    fun getDepthMap(imagePath: String, promise: Promise) {
        try {
            // Carregar e pré-processar a imagem
            val inputImage = loadImageAndPreprocess(imagePath)
            val outputBuffer = Array(1) { Array(256) { FloatArray(256) } }

            // Executar a inferência
            interpreter.run(inputImage, outputBuffer)

            // Retornar o resultado (exemplo de processamento do output)
            promise.resolve(outputBuffer[0])
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun loadModelFile(context: Context, modelPath: String): ByteBuffer {
        // Função para carregar o modelo TFLite do diretório de ativos
        val assetFileDescriptor = context.assets.openFd(modelPath)
        val inputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    private fun loadImageAndPreprocess(imagePath: String): FloatArray {
        // Carregar a imagem como um Bitmap
        val file = File(imagePath)
        val bitmap = BitmapFactory.decodeFile(file.absolutePath)

        // Redimensionar o bitmap para 256x256
        val resizedBitmap = Bitmap.createScaledBitmap(bitmap, 256, 256, true)

        // Converter o bitmap para array de floats
        val floatArray = FloatArray(256 * 256 * 3)
        val buffer = ByteBuffer.allocateDirect(256 * 256 * 3 * 4).order(ByteOrder.nativeOrder())

        resizedBitmap.copyPixelsToBuffer(buffer)
        buffer.rewind()

        for (i in 0 until 256 * 256) {
            val r = (buffer.get(i * 4).toInt() and 0xFF).toFloat() / 255.0f
            val g = (buffer.get(i * 4 + 1).toInt() and 0xFF).toFloat() / 255.0f
            val b = (buffer.get(i * 4 + 2).toInt() and 0xFF).toFloat() / 255.0f

            floatArray[i * 3] = r
            floatArray[i * 3 + 1] = g
            floatArray[i * 3 + 2] = b
        }

        return floatArray
    }

    companion object {
        const val NAME = "NativeDepthEstimation"
    }
}
