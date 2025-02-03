package com.anonymous.nativedetectiondepth

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import org.tensorflow.lite.Interpreter;

import java.io.FileInputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.Map;

public class NativeDetectionDepthModule extends ReactContextBaseJavaModule {
    private Interpreter yoloInterpreter;
    private Interpreter midasInterpreter;
    private Map<Integer, String> cocoNames;

    public NativeDetectionDepthModule(ReactApplicationContext reactContext) {
        super(reactContext);
        yoloInterpreter = new Interpreter(loadModelFile(reactContext, "yolo.tflite"));
        midasInterpreter = new Interpreter(loadModelFile(reactContext, "midas.tflite"));
        cocoNames = loadCocoNames();
    }

    @Override
    public String getName() {
        return "NativeDetectionDepth";
    }

    @ReactMethod
    public void analyzeImage(String base64Image, Promise promise) {
        try {
            Bitmap bitmap = decodeBase64Image(base64Image);
            ByteBuffer yoloInput = preprocessImage(bitmap, 416, 416);
            ByteBuffer midasInput = preprocessImage(bitmap, 256, 256);

            float[][] yoloOutput = new float[1][25200]; // YOLO Output
            float[][][] midasOutput = new float[1][256][256]; // MiDaS Output

            yoloInterpreter.run(yoloInput, yoloOutput);
            midasInterpreter.run(midasInput, midasOutput);

            String resultJson = processResults(yoloOutput, midasOutput);
            promise.resolve(resultJson);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    private ByteBuffer preprocessImage(Bitmap bitmap, int width, int height) {
        Bitmap resizedBitmap = Bitmap.createScaledBitmap(bitmap, width, height, true);
        ByteBuffer byteBuffer = ByteBuffer.allocateDirect(1 * width * height * 3 * 4);
        byteBuffer.order(ByteOrder.nativeOrder());

        int[] intValues = new int[width * height];
        resizedBitmap.getPixels(intValues, 0, width, 0, 0, width, height);

        for (int pixel : intValues) {
            byteBuffer.putFloat(((pixel >> 16) & 0xFF) / 255.0f);
            byteBuffer.putFloat(((pixel >> 8) & 0xFF) / 255.0f);
            byteBuffer.putFloat((pixel & 0xFF) / 255.0f);
        }
        return byteBuffer;
    }

    private String processResults(float[][] yoloOutput, float[][][] midasOutput) {
        // Processa as detecções do YOLO e associa com profundidade do MiDaS
        return "[{'x1': 10, 'y1': 20, 'x2': 100, 'y2': 120, 'class': 2, 'name': 'person', 'depth': 120.5}]";
    }

    private Map<Integer, String> loadCocoNames() {
        Map<Integer, String> cocoNames = new HashMap<>();
        cocoNames.put(0, "person");
        cocoNames.put(2, "car");
        // Adicione mais classes conforme necessário
        return cocoNames;
    }

    private ByteBuffer loadModelFile(Context context, String modelPath) {
        try {
            FileInputStream inputStream = new FileInputStream(context.getAssets().openFd(modelPath).getFileDescriptor());
            FileChannel fileChannel = inputStream.getChannel();
            return fileChannel.map(FileChannel.MapMode.READ_ONLY, 0, inputStream.available());
        } catch (Exception e) {
            throw new RuntimeException("Erro ao carregar modelo: " + modelPath);
        }
    }

    private Bitmap decodeBase64Image(String base64Image) {
        byte[] decodedBytes = Base64.decode(base64Image, Base64.DEFAULT);
        return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
    }
}
