import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import NativeCoapClient from "@/specs/NativeCoapClient";
import useDeviceStore from "@/stores/device";
import { COAP_SERVER_URL } from "@env";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  Accelerometer,
  AccelerometerMeasurement,
  Gyroscope,
  GyroscopeMeasurement,
} from "expo-sensors";
import { useEffect, useRef, useState } from "react";

export default function SensorsDataCapture() {
  const { deviceId } = useDeviceStore();
  const [accelerometerData, setAccelerometerData] = useState<
    AccelerometerMeasurement[]
  >([]);
  const [gyroscopeData, setGyroscopeData] = useState<GyroscopeMeasurement[]>(
    []
  );
  const [locationData, setLocationData] =
    useState<Location.LocationObject | null>(null);
  const tempAccelerometerData = useRef<AccelerometerMeasurement[]>([]);
  const tempGyroscopeData = useRef<GyroscopeMeasurement[]>([]);
  const accelerometerDataRef = useRef(accelerometerData);
  const gyroscopeDataRef = useRef(gyroscopeData);
  const locationDataRef = useRef(locationData);
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
    let accelerometerSubscription: any;
    let gyroscopeSubscription: any;
    let locationSubscription: any;

    accelerometerDataRef.current = accelerometerData;
    gyroscopeDataRef.current = gyroscopeData;
    locationDataRef.current = locationData;

    const startCapturing = async () => {
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        console.warn("Localização não permitida");
        return;
      }

      accelerometerSubscription = Accelerometer.addListener(
        (data: AccelerometerMeasurement) => {
          tempAccelerometerData.current.push(data);
          if (
            tempGyroscopeData.current.length > 0 &&
            tempAccelerometerData.current.length >=
              tempGyroscopeData.current.length
          ) {
            const matchingLength = tempGyroscopeData.current.length;
            const accelerometerBatch = tempAccelerometerData.current.splice(
              0,
              matchingLength
            );
            const gyroscopeBatch = tempGyroscopeData.current.splice(
              0,
              matchingLength
            );

            accelerometerDataRef.current = [
              ...accelerometerDataRef.current,
              ...accelerometerBatch,
            ];
            gyroscopeDataRef.current = [
              ...gyroscopeDataRef.current,
              ...gyroscopeBatch,
            ];
            setAccelerometerData(accelerometerDataRef.current);
            setGyroscopeData(gyroscopeDataRef.current);
          }
        }
      );
      Accelerometer.setUpdateInterval(captureInterval);

      gyroscopeSubscription = Gyroscope.addListener(
        (data: GyroscopeMeasurement) => {
          tempGyroscopeData.current.push(data);
          if (
            tempAccelerometerData.current.length > 0 &&
            tempGyroscopeData.current.length >=
              tempAccelerometerData.current.length
          ) {
            const matchingLength = tempAccelerometerData.current.length;
            const accelerometerBatch = tempAccelerometerData.current.splice(
              0,
              matchingLength
            );
            const gyroscopeBatch = tempGyroscopeData.current.splice(
              0,
              matchingLength
            );

            accelerometerDataRef.current = [
              ...accelerometerDataRef.current,
              ...accelerometerBatch,
            ];
            gyroscopeDataRef.current = [
              ...gyroscopeDataRef.current,
              ...gyroscopeBatch,
            ];
            setAccelerometerData(accelerometerDataRef.current);
            setGyroscopeData(gyroscopeDataRef.current);
          }
        }
      );
      Gyroscope.setUpdateInterval(captureInterval);

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: captureInterval,
        },
        (location: Location.LocationObject) => {
          locationDataRef.current = location;
          setLocationData(location);
        }
      );
    };

    startCapturing();

    const sendDataInterval = setInterval(() => {
      const payload = JSON.stringify({
        deviceId,
        accelerometerData: accelerometerDataRef.current,
        gyroscopeData: gyroscopeDataRef.current,
        locationData: locationDataRef.current,
      });

      const payloadChunks = chunkPayload(payload, maxChunkSize);

      payloadChunks.forEach((chunk, index) => {
        const chunkPayload = JSON.stringify({
          index,
          totalChunks: payloadChunks.length,
          chunk,
          deviceId,
        });

        NativeCoapClient?.sendCoapRequest(
          "POST",
          `${COAP_SERVER_URL}/sensorsDataCapture`,
          chunkPayload
        );
      });

      setAccelerometerData([]);
      setGyroscopeData([]);
      accelerometerDataRef.current = [];
      gyroscopeDataRef.current = [];
    }, sendInterval);

    return () => {
      accelerometerSubscription && accelerometerSubscription.remove();
      gyroscopeSubscription && gyroscopeSubscription.remove();
      locationSubscription && locationSubscription.remove();
      clearInterval(sendDataInterval);
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
