package com.anonymous.nativedetectiondepth

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReactContextBaseJavaModule
import org.tensorflow.lite.Interpreter
import java.io.BufferedReader
import java.io.FileInputStream
import java.io.InputStreamReader
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel
import kotlin.math.max
import kotlin.math.min

class NativeDetectionDepthModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val yoloInterpreter: Interpreter
    private val midasInterpreter: Interpreter
    private val cocoNames: List<String>

    init {
        yoloInterpreter = Interpreter(loadModelFile(reactContext, "yolo.tflite"))
        midasInterpreter = Interpreter(loadModelFile(reactContext, "midas.tflite"))
        cocoNames = loadCocoNames(reactContext)
    }

    override fun getName() = NAME

    override fun analyzeImage(base64Image: String, promise: Promise) {
        try {
            val bitmap = decodeBase64Image(base64Image)
            val yoloInput = preprocessImage(bitmap, 416, 416)
            val midasInput = preprocessImage(bitmap, 256, 256)

            val yoloOutput = Array(1) { FloatArray(25200) } // YOLO Output
            val midasOutput = Array(1) { Array(256) { FloatArray(256) } } // MiDaS Output

            yoloInterpreter.run(yoloInput, yoloOutput)
            midasInterpreter.run(midasInput, midasOutput)

            val resultJson = processResults(yoloOutput[0], midasOutput[0], bitmap.width, bitmap.height)
            promise.resolve(resultJson)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun preprocessImage(bitmap: Bitmap, width: Int, height: Int): ByteBuffer {
        val resizedBitmap = Bitmap.createScaledBitmap(bitmap, width, height, true)
        val byteBuffer = ByteBuffer.allocateDirect(1 * width * height * 3 * 4)
        byteBuffer.order(ByteOrder.nativeOrder())

        val intValues = IntArray(width * height)
        resizedBitmap.getPixels(intValues, 0, width, 0, 0, width, height)

        for (pixel in intValues) {
            byteBuffer.putFloat(((pixel shr 16) and 0xFF) / 255.0f)
            byteBuffer.putFloat(((pixel shr 8) and 0xFF) / 255.0f)
            byteBuffer.putFloat((pixel and 0xFF) / 255.0f)
        }
        return byteBuffer
    }

    private fun processResults(yoloOutput: FloatArray, midasOutput: Array<FloatArray>, imgWidth: Int, imgHeight: Int): String {
        val detectedObjects = mutableListOf<Map<String, Any>>()

        val CONFIDENCE_THRESHOLD = 0.5
        val OBSTACLE_THRESHOLD = 200.0

        for (i in yoloOutput.indices step 6) {
            val x_center = yoloOutput[i]
            val y_center = yoloOutput[i + 1]
            val w = yoloOutput[i + 2]
            val h = yoloOutput[i + 3]
            val confidence = yoloOutput[i + 4]
            val class_id = yoloOutput[i + 5].toInt()

            if (confidence > CONFIDENCE_THRESHOLD) {
                val x1 = ((x_center - w / 2) * imgWidth).toInt()
                val y1 = ((y_center - h / 2) * imgHeight).toInt()
                val x2 = ((x_center + w / 2) * imgWidth).toInt()
                val y2 = ((y_center + h / 2) * imgHeight).toInt()

                // Calculate mean depth for the detected object
                val depthMapWidth = midasOutput[0].size
                val depthMapHeight = midasOutput.size
                val depthX1 = (x1 * depthMapWidth / imgWidth).coerceIn(0, depthMapWidth - 1)
                val depthY1 = (y1 * depthMapHeight / imgHeight).coerceIn(0, depthMapHeight - 1)
                val depthX2 = (x2 * depthMapWidth / imgWidth).coerceIn(0, depthMapWidth - 1)
                val depthY2 = (y2 * depthMapHeight / imgHeight).coerceIn(0, depthMapHeight - 1)

                val depthValues = mutableListOf<Float>()
                for (y in depthY1..depthY2) {
                    for (x in depthX1..depthX2) {
                        depthValues.add(midasOutput[y][x])
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
                            "class" to class_id,
                            "name" to cocoNames[class_id],
                            "depth" to meanDepth
                        )
                    )
                }
            }
        }

        return detectedObjects.toString()
    }

    private fun loadCocoNames(context: Context): List<String> {
        return try {
            val reader = BufferedReader(InputStreamReader(context.assets.open("coco.names")))
            reader.readLines()
        } catch (e: Exception) {
            throw RuntimeException("Erro ao carregar coco.names", e)
        }
    }

    private fun loadModelFile(context: Context, modelPath: String): ByteBuffer {
        return try {
            val inputStream = FileInputStream(context.assets.openFd(modelPath).fileDescriptor)
            val fileChannel = inputStream.channel
            fileChannel.map(FileChannel.MapMode.READ_ONLY, 0, inputStream.available().toLong())
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

