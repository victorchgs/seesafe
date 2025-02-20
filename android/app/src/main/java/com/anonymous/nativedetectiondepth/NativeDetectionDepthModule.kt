package com.anonymous.nativedetectiondepth

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import com.anonymous.seesafespecs.NativeDetectionDepthSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel
import com.google.gson.Gson


class NativeDetectionDepthModule(reactContext: ReactApplicationContext) :
    NativeDetectionDepthSpec(reactContext) {

    private val yoloInterpreter: Interpreter
    private val midasInterpreter: Interpreter
    private val cocoNames: List<String>

    init {
        // Carregando o modelo YOLO
        yoloInterpreter = Interpreter(loadModelFile(reactContext, "yolo.tflite"))
        yoloInterpreter.allocateTensors() // Aloca os tensores do YOLO

        val yoloInputTensorIndex = 0 // Supondo que o índice do tensor de entrada seja 0
        val yoloInputShape = yoloInterpreter.getInputTensor(yoloInputTensorIndex).shape() // Forma do tensor
        Log.d("YOLO", "Input shape: ${yoloInputShape.joinToString(", ")}")

        val yoloOutputTensorIndex = 0 // Supondo que o índice do tensor de saída seja 0
        val yoloOutputShape = yoloInterpreter.getOutputTensor(yoloOutputTensorIndex).shape() // Forma do tensor de saída
        Log.d("YOLO", "Output shape: ${yoloOutputShape.joinToString(", ")}")

        // Carregando o modelo MiDaS
        midasInterpreter = Interpreter(loadModelFile(reactContext, "midas.tflite"))
        midasInterpreter.allocateTensors() // Aloca os tensores do MiDaS

        val midasInputTensorIndex = 0 // Supondo que o índice do tensor de entrada seja 0
        val midasInputShape = midasInterpreter.getInputTensor(midasInputTensorIndex).shape() // Forma do tensor
        Log.d("MiDaS", "Input shape: ${midasInputShape.joinToString(", ")}")

        val midasOutputTensorIndex = 0 // Supondo que o índice do tensor de saída seja 0
        val midasOutputShape = midasInterpreter.getOutputTensor(midasOutputTensorIndex).shape() // Forma do tensor de saída
        Log.d("MiDaS", "Output shape: ${midasOutputShape.joinToString(", ")}")

        cocoNames = loadCocoNames(reactContext)
    }

    override fun getName() = NAME

    @ReactMethod
    override fun analyzeImage(base64Image: String, promise: Promise) {
        try {
            val bitmap = decodeBase64Image(base64Image)
            val yoloInput = preprocessImage(bitmap, 320, 320) // Ajuste para corresponder ao YOLO
            val midasInput = preprocessImage(bitmap, 256, 256) // Ajuste para corresponder ao MiDaS

            val yoloOutput = Array(1) { Array(6300) { FloatArray(85) } } // Ajuste para a forma do tensor de saída do YOLO
            val midasOutput = Array(1) { Array(256) { Array(256) { FloatArray(1) }}} // Ajuste para a forma do tensor de saída do MiDaS

            yoloInterpreter.run(yoloInput, yoloOutput)
            midasInterpreter.run(midasInput, midasOutput)

            val midasOutputArray = Array(256) { FloatArray(256) }
            for (y in 0 until 256) {
                for (x in 0 until 256) {
                    midasOutputArray[y][x] = midasOutput[0][y][x][0]
                }
            }


            val resultJson = processResults(
                yoloOutput[0],
                midasOutputArray,
                bitmap.width,
                bitmap.height
            )

            promise.resolve(resultJson)
        } catch (e: Exception) {
            Log.e("NativeDetectionDepth", "Erro ao analisar a imagem", e)
            promise.reject("ERROR", e.message)
        }
    }

    private fun preprocessImage(bitmap: Bitmap, width: Int, height: Int): ByteBuffer {
        val resizedBitmap = Bitmap.createScaledBitmap(bitmap, width, height, true)
        val byteBuffer = ByteBuffer.allocateDirect(width * height * 3 * java.lang.Float.BYTES)
        byteBuffer.order(ByteOrder.nativeOrder())

        val intValues = IntArray(width * height)
        resizedBitmap.getPixels(intValues, 0, width, 0, 0, width, height)

        for (pixel in intValues) {
            byteBuffer.putFloat(((pixel shr 16) and 0xFF) / 255.0f) // R
            byteBuffer.putFloat(((pixel shr 8) and 0xFF) / 255.0f) // G
            byteBuffer.putFloat((pixel and 0xFF) / 255.0f) // B
        }
        return byteBuffer
    }

    private fun processResults(yoloOutput: Array<FloatArray>, midasOutput: Array<FloatArray>, imgWidth: Int, imgHeight: Int): String {
        val detectedObjects = mutableListOf<Map<String, Any>>()
        val CONFIDENCE_THRESHOLD = 0.3
        val OBSTACLE_THRESHOLD = 200.0

        for (i in yoloOutput.indices) {
            val xCenter = yoloOutput[i][0]
            val yCenter = yoloOutput[i][1]
            val w = yoloOutput[i][2]
            val h = yoloOutput[i][3]
            val confidence = yoloOutput[i][4]
            val classId = yoloOutput[i][5].toInt()

            if (confidence > CONFIDENCE_THRESHOLD) {
                val x1 = ((xCenter - w / 2) * imgWidth).toInt()
                val y1 = ((yCenter - h / 2) * imgHeight).toInt()
                val x2 = ((xCenter + w / 2) * imgWidth).toInt()
                val y2 = ((yCenter + h / 2) * imgHeight).toInt()

                val depthMapWidth = 256
                val depthMapHeight = 256

                val depthX1 = (x1 * depthMapWidth / imgWidth).coerceIn(0, depthMapWidth - 1)
                val depthY1 = (y1 * depthMapHeight / imgHeight).coerceIn(0, depthMapHeight - 1)
                val depthX2 = (x2 * depthMapWidth / imgWidth).coerceIn(0, depthMapWidth - 1)
                val depthY2 = (y2 * depthMapHeight / imgHeight).coerceIn(0, depthMapHeight - 1)

                val depthValues = mutableListOf<Float>()
                for (y in depthY1..depthY2) {
                    for (x in depthX1..depthX2) {
                        val depthValue = midasOutput[y][x]
                        depthValues.add(depthValue)
                    }
                }

                val meanDepth = depthValues.average()
                if (meanDepth > OBSTACLE_THRESHOLD) {
                    detectedObjects.add(
                        mapOf(
                            "x1" to x1,
                            "y1" to y1,
                            "x2" to x2,
                            "y2" to y2,
                            "class" to classId,
                            "name" to cocoNames.getOrElse(classId) { "Unknown" },
                            "depth" to meanDepth
                        )
                    )
                }
            }
        }
        // Retornar a string JSON corretamente formatada
        return Gson().toJson(detectedObjects)
    }


    private fun loadCocoNames(context: Context): List<String> {
        return try {
            context.assets.open("coco.names").bufferedReader().readLines()
        } catch (e: Exception) {
            throw RuntimeException("Erro ao carregar coco.names", e)
        }
    }

    private fun loadModelFile(context: Context, modelPath: String): ByteBuffer {
        return try {
            val assetFileDescriptor = context.assets.openFd(modelPath)
            val inputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
            val fileChannel = inputStream.channel
            fileChannel.map(FileChannel.MapMode.READ_ONLY, assetFileDescriptor.startOffset, assetFileDescriptor.declaredLength)
        } catch (e: Exception) {
            throw RuntimeException("Erro ao carregar modelo: $modelPath", e)
        }
    }

    private fun decodeBase64Image(base64Image: String): Bitmap {
        val decodedBytes = Base64.decode(base64Image, Base64.DEFAULT)
        return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
    }

    companion object {
        const val NAME = "NativeDetectionDepth"
    }
}
