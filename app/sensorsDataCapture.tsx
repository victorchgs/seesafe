import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import NativeCoapClient from "@/specs/NativeCoapClient";
import useDeviceStore from "@/stores/device";
import {
  startAccelerometer,
  stopAccelerometer,
} from "@/utils/startAccelerometer";
import { startGeolocation } from "@/utils/startGeolocation";
import { startGyroscope, stopGyroscope } from "@/utils/startGyroscope";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

export default function SensorsDataCapture() {
  const { deviceId } = useDeviceStore();
  const [accelerometerData, setAccelerometerData] = useState<any>(null);
  const [gyroscopeData, setGyroscopeData] = useState<any>(null);
  const [geolocationData, setGeolocationData] = useState<any>(null);

  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sendIntervalMs = 1000;
  const captureIntervalMs = sendIntervalMs - 500;

  const captureSensorsData = () => {
    startAccelerometer(setAccelerometerData);
    startGyroscope(setGyroscopeData);
    startGeolocation()
      .then((location) => setGeolocationData(location))
      .catch((error) => console.error("Erro ao capturar localização:", error));
  };

  const sendDataToServer = () => {
    const data = {
      deviceId,
      accelerometerData,
      gyroscopeData,
      geolocationData,
    };

    const payload = JSON.stringify(data);

    NativeCoapClient?.sendCoapRequest(
      "POST",
      "192.168.0.194:5683/sensorsDataCapture",
      payload
    ).catch((error) => {
      console.error("Erro ao enviar dados para o servidor:", error);
    });
  };

  useEffect(() => {
    captureIntervalRef.current = setInterval(
      captureSensorsData,
      captureIntervalMs
    );

    sendIntervalRef.current = setInterval(sendDataToServer, sendIntervalMs);

    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
      stopAccelerometer();
      stopGyroscope();
    };
  }, []);

  return (
    <Box className="h-full bg-white dark:bg-slate-900">
      <Center className="h-full">
        <Button
          onPress={() => {
            router.back();
          }}
          className="h-auto py-5 px-7 rounded-2xl"
        >
          <ButtonText className="text-2xl">Voltar</ButtonText>
        </Button>
      </Center>
    </Box>
  );
}
