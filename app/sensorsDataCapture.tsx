import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import NativeCoapClient from "@/specs/NativeCoapClient";
import useDeviceStore from "@/stores/device";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  Accelerometer,
  AccelerometerMeasurement,
  Gyroscope,
  GyroscopeMeasurement,
} from "expo-sensors";
import { Share } from "react-native";
import { useEffect, useRef } from "react";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Icon, ShareIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";

export default function SensorsDataCapture() {
  const { deviceId, shareCode } = useDeviceStore();
  const tempAccelerometerData = useRef<AccelerometerMeasurement[]>([]);
  const tempGyroscopeData = useRef<GyroscopeMeasurement[]>([]);
  const locationDataRef = useRef<Location.LocationObject | null>(null);
  const captureInterval = 100;
  const sendInterval = 6000;
  const maxChunkSize = 700;

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
            "192.168.0.194:5683/sensorsData",
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
      </Center>
    </Box>
  );
}
