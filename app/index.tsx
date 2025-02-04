import React, { useState, useEffect, useRef } from "react";
import { View, Text, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Box } from "@/components/ui/box";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import NativeCoapClient from "@/specs/NativeCoapClient";
import NativeDepthEstimation from "@/specs/NativeDepthEstimation";
import NativeDetectionDepth from "@/specs/NativeDetectionDepth";
import useDeviceStore from "@/stores/device";
import { router } from "expo-router";

export default function Index() {
  const { deviceId, setDeviceId } = useDeviceStore();
  const [hasPermission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (hasPermission?.granted === false) {
      requestPermission();
    }
  }, [hasPermission]);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      const base64Data = photo?.base64;
      const base64ImageString = `data:image/jpeg;base64,${base64Data}`;

      // console.log(base64ImageString);

      NativeDetectionDepth?.analyzeImage(base64ImageString.split("base64,")[1])
        .then((resultJson) => {
          console.log("Resultado da análise de imagem:", resultJson);
          const detectedObjects = JSON.parse(resultJson);
          console.log("Objetos detectados:", detectedObjects);
          // Process the detected objects as needed
        })
        .catch((error) => {
          console.error("Erro ao analisar a imagem:", error);
        });

      // NativeDepthEstimation?.getDepthMap(base64ImageString.split("base64,")[1])
      //   .then((depthMapJson) => {
      //     const depthMap = JSON.parse(depthMapJson);

      //     // Encontrar o valor máximo na matriz de profundidade original
      //     const maxDepthValue = Math.max(...depthMap.flat());

      //     // Definir as coordenadas de corte para uma região menor
      //     const startX = 64; // Margem esquerda
      //     const endX = 194; // Margem direita
      //     const startY = 0; // Margem superior
      //     const endY = 190; // Margem inferior

      //     // Cortar a matriz central
      //     const centralDepthMap = depthMap
      //       .slice(startY, endY)
      //       .map((row) => row.slice(startX, endX));

      //     // Verificar objetos próximos com base em um percentual do valor máximo da matriz original
      //     const proximityThreshold = 0.6 * maxDepthValue;
      //     const nearbyDetected = centralDepthMap
      //       .flat()
      //       .some((value) => value > proximityThreshold);

      //     console.log("Mapa de profundidade central:", centralDepthMap);
      //     console.log("Objetos próximos detectados:", nearbyDetected);
      //   })
      //   .catch((error) => {
      //     console.error("Erro ao obter o mapa de profundidade:", error);
      //   });
    }
  };

  const handleLowVisionFlux = () => {
    const payload = JSON.stringify({ deviceId });

    NativeCoapClient?.sendCoapRequest(
      "POST",
      "192.168.0.194/deviceAuth",
      payload
    )
      .then((response) => {
        const parsedResponse = JSON.parse(response);
        const parsedData = JSON.parse(parsedResponse.body.data);

        if (parsedData.deviceId) {
          setDeviceId(parsedData.deviceId);
          router.push("/sensorsDataCapture");
        } else {
          throw new Error("Acesso negado?");
        }
      })
      .catch((error) => {
        console.error("Erro ao enviar requisição CoAP:", error);
      });
  };

  return (
    <Box className="h-full bg-white dark:bg-slate-900">
      <Center className="h-full">
        {hasPermission?.granted && <CameraView ref={cameraRef} />}
        <ButtonGroup space="4xl">
          <Button
            onPress={takePicture}
            className="h-auto py-5 px-7 rounded-2xl"
          >
            <ButtonText className="text-2xl">
              Obter Mapa de Profundidade
            </ButtonText>
          </Button>
          <Button
            onPress={handleLowVisionFlux}
            className="h-auto py-5 px-7 rounded-2xl"
          >
            <ButtonText className="text-2xl">Auxíliar de locomoção</ButtonText>
          </Button>
          <Button
            onPress={() => {
              router.push("/carer");
            }}
            className="h-auto py-5 px-7 rounded-2xl"
          >
            <ButtonText className="text-2xl">Sou cuidador</ButtonText>
          </Button>
        </ButtonGroup>
      </Center>
    </Box>
  );
}
