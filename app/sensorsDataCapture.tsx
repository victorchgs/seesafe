import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon, ShareIcon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import NativeCameraX from "@/specs/NativeCameraX";
import NativeCoapClient from "@/specs/NativeCoapClient";
import NativeDepthEstimation from "@/specs/NativeDepthEstimation";
import useDeviceStore from "@/stores/device";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  Accelerometer,
  AccelerometerMeasurement,
  Gyroscope,
  GyroscopeMeasurement,
} from "expo-sensors";
import * as Speech from "expo-speech";
import { Share } from "react-native";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { useEffect, useRef, useState } from "react";

export default function SensorsDataCapture() {
  const { deviceId, shareCode } = useDeviceStore();
  const tempAccelerometerData = useRef<AccelerometerMeasurement[]>([]);
  const tempGyroscopeData = useRef<GyroscopeMeasurement[]>([]);
  const locationDataRef = useRef<Location.LocationObject | null>(null);
  const captureInterval = 100;
  const sendInterval = 6000;
  const maxChunkSize = 700;
  const [warningMessage, setWarningMessage] = useState("");
  const prevWarningMessage = useRef("");

  const chunkPayload = (payload: string, size: number) => {
    const numChunks = Math.ceil(payload.length / size);
    const chunks = [];

    for (let i = 0; i < numChunks; i++) {
      chunks.push(payload.slice(i * size, (i + 1) * size));
    }

    return chunks;
  };

  useEffect(() => {
    let accelerometerSubscription: { remove: () => void } | null = null;
    let gyroscopeSubscription: { remove: () => void } | null = null;
    let locationSubscription: { remove: () => void } | null = null;

    const startCapturing = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.warn("Localização não permitida");
        return;
      }

      accelerometerSubscription = Accelerometer.addListener((data) => {
        tempAccelerometerData.current.push(data);
      });
      Accelerometer.setUpdateInterval(captureInterval);

      gyroscopeSubscription = Gyroscope.addListener((data) => {
        tempGyroscopeData.current.push(data);
      });
      Gyroscope.setUpdateInterval(captureInterval);

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: captureInterval,
        },
        (location) => {
          locationDataRef.current = location;
        }
      );
    };

    startCapturing();

    const sendDataInterval = setInterval(() => {
      const payload = JSON.stringify({
        deviceId,
        accelerometerData: tempAccelerometerData.current,
        gyroscopeData: tempGyroscopeData.current,
        locationData: locationDataRef.current,
      });

      const payloadChunks = chunkPayload(payload, maxChunkSize);

      if (NativeCoapClient) {
        payloadChunks.forEach((chunk, index) => {
          NativeCoapClient?.sendRequest(
            "POST",
            "172.20.48.1:5683/sensorsData",
            false,
            JSON.stringify({
              index,
              totalChunks: payloadChunks.length,
              chunk,
              deviceId,
            })
          );
        });
      } else {
        console.log("NativeCoapClient não está disponível");
      }

      tempAccelerometerData.current = [];
      tempGyroscopeData.current = [];
    }, sendInterval);

    return () => {
      accelerometerSubscription?.remove();
      gyroscopeSubscription?.remove();
      locationSubscription?.remove();
      clearInterval(sendDataInterval);
    };
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${shareCode}`,
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  const speakWarning = (message: any) => {
    Speech.speak(message, {
      language: "pt-BR",
      pitch: 1.0,
      rate: 1.0,
    });
  };

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permissionStatus = await request(PERMISSIONS.ANDROID.CAMERA);

      if (permissionStatus !== RESULTS.GRANTED) {
        console.error("Permissão de câmera negada");
        return;
      }
    };

    requestCameraPermission();
  }, []);

  useEffect(() => {
    let isProcessing = false;

    const captureAndProcess = async () => {
      const permissionStatus = await request(PERMISSIONS.ANDROID.CAMERA);

      if (permissionStatus !== RESULTS.GRANTED) {
        console.error("Permissão de câmera negada");
        return;
      }

      if (isProcessing) return;

      isProcessing = true;

      try {
        if (NativeCameraX) {
          console.log("Capturando imagem...");
          const base64Image = await NativeCameraX.captureImage();

          console.log("Imagem capturada, processando...");
          const depthMapJson = await NativeDepthEstimation.getDepthMap(
            base64Image
          );

          const depthMap = JSON.parse(depthMapJson);

          const maxDepthValue = Math.max(...depthMap.flat());

          const centralDepthMap = depthMap
            .slice(0, 190)
            .map((row: any) => row.slice(64, 194));

          const proximityThreshold = 0.7 * maxDepthValue;

          const nearbyDetected = centralDepthMap
            .flat()
            .some((value: number) => value > proximityThreshold);

          console.log(nearbyDetected);

          const newMessage = nearbyDetected
            ? "Atenção! Objeto próximo detectado!"
            : "Não há objetos próximos.";

          setWarningMessage(newMessage);
        } else {
          console.log("NativeCameraX não está disponível");
        }
      } catch (error) {
        console.error("Erro ao capturar/processar imagem:", error);
      }

      isProcessing = false;
      setTimeout(captureAndProcess, captureInterval);
    };

    captureAndProcess();

    return () => {
      isProcessing = true;
    };
  }, []);

  useEffect(() => {
    if (warningMessage && warningMessage !== prevWarningMessage.current) {
      speakWarning(warningMessage);

      prevWarningMessage.current = warningMessage;
    }
  }, [warningMessage]);

  return (
    <Box className="h-full bg-white dark:bg-slate-900">
      <Center className="h-full">
        <VStack space="lg">
          <Button
            onPress={() => router.back()}
            className="h-auto py-5 px-7 mx-auto rounded-2xl"
          >
            <ButtonText className="text-2xl">Voltar</ButtonText>
          </Button>
          <Card>
            <VStack space="2xl">
              <VStack space="md">
                <Heading size="lg">
                  Este é o seu código de compartilhamento
                </Heading>
                <Pressable onPress={handleShare}>
                  <HStack space="lg" className="justify-center">
                    <Text size="lg">{shareCode}</Text>
                    <Icon as={ShareIcon} size="lg" />
                  </HStack>
                </Pressable>
              </VStack>
            </VStack>
          </Card>
        </VStack>
        <VStack space="lg">
          <Card>
            <VStack space="2xl">
              <Heading size="lg">Monitoramento de Profundidade</Heading>
              <Text>{warningMessage}</Text>
            </VStack>
          </Card>
        </VStack>
      </Center>
    </Box>
  );
}
