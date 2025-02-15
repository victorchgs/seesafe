import { Box } from "@/components/ui/box";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import NativeCoapClient from "@/specs/NativeCoapClient";
import NativeCameraX from "@/specs/NativeCameraX";
import NativeDepthEstimation from "@/specs/NativeDepthEstimation";
import useDeviceStore from "@/stores/device";
import { router } from "expo-router";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon, CloseIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "react-native";

export default function Index() {
  const [warningMessage, setWarningMessage] = useState("");

  const { deviceId, setDeviceId, shareCode, setShareCode } = useDeviceStore();

  const handleLowVisionFlux = () => {
    const payload = JSON.stringify({ deviceId, shareCode });

    if (NativeCoapClient) {
      NativeCoapClient?.sendRequest(
        "POST",
        "192.168.0.194:5683/deviceAuth",
        true,
        payload
      )
        .then((response) => {
          const parsedResponse = JSON.parse(response);
          const data = parsedResponse.body.data;

          if (data?.deviceId) {
            setDeviceId(data.deviceId);
            setShareCode(data.shareCode);
            router.push("/sensorsDataCapture");
          } else {
            throw new Error("Acesso negado?");
          }
        })
        .catch((error) => {
          console.error("Erro ao enviar requisição CoAP:", error);
        });
    } else {
      console.log("NativeCoapClient não está disponível");
    }
  };

  // const handleCaptureAndProcess = async () => {
  //   try {
  //     if (!NativeCameraX || !NativeDepthEstimation) {
  //       console.error("Módulos nativos não disponíveis");
  //       return;
  //     }

  //     const permissionStatus = await request(PERMISSIONS.ANDROID.CAMERA);

  //     if (permissionStatus !== RESULTS.GRANTED) {
  //       console.error("Permissão de câmera negada");
  //       return;
  //     }

  //     console.log("Capturando imagem...");
  //     const base64Image = await NativeCameraX.captureImage();
  //     console.log("Imagem capturada, processando...");

  //     const depthMap = await NativeDepthEstimation.getDepthMap(base64Image);
  //     console.log("Mapa de profundidade:", depthMap);
  //   } catch (error) {
  //     console.error("Erro ao capturar/processar imagem:", error);
  //   }
  // };

  const handleCaptureAndProcess = async () => {
    try {
      if (!NativeCameraX || !NativeDepthEstimation) {
        console.error("Módulos nativos não disponíveis");
        return;
      }

      const permissionStatus = await request(PERMISSIONS.ANDROID.CAMERA);
      if (permissionStatus !== RESULTS.GRANTED) {
        console.error("Permissão de câmera negada");
        return;
      }

      console.log("Capturando imagem...");
      const base64Image = await NativeCameraX.captureImage();
      console.log("Imagem capturada, processando...");

      const depthMapJson = await NativeDepthEstimation.getDepthMap(base64Image);
      const depthMap = JSON.parse(depthMapJson);

      // Encontrar o valor máximo na matriz de profundidade
      let maxDepthValue = -Infinity;
      for (let row of depthMap) {
        for (let value of row) {
          if (value > maxDepthValue) {
            maxDepthValue = value;
          }
        }
      }

      // Define os limites da região central
      const startX = 64;
      const endX = 194;
      const startY = 0;
      const endY = 190;

      let nearbyDetected = false;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (depthMap[y][x] > 0.6 * maxDepthValue) {
            nearbyDetected = true;
            break;
          }
        }
        if (nearbyDetected) break;
      }

      console.log("Objetos próximos detectados:", nearbyDetected);

      // Exibir aviso se um objeto estiver muito próximo
      if (nearbyDetected) {
        setWarningMessage("Atenção! Objeto próximo detectado!");
      } else {
        setWarningMessage("Não há objetos próximos detectados.");
      }

      // Libera memória manualmente
      depthMap.length = 0;
      global.gc?.();

      // Delay para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Erro ao capturar/processar imagem:", error);
    }
  };

  function ProximityAlert({
    message,
    onClose,
  }: {
    message: string;
    onClose: () => void;
  }) {
    return (
      <Card variant="outline" className="m-4 p-0 border-yellow-500">
        <HStack space="md">
          <Box className="bg-yellow-500 w-1 h-full" />
          <VStack space="sm" className="py-2 pr-8">
            <HStack className="justify-between items-center w-full">
              <Heading>Atenção!</Heading>
              <Pressable onPress={onClose}>
                <Icon as={CloseIcon} />
              </Pressable>
            </HStack>
            <Text>{message}</Text>
          </VStack>
        </HStack>
      </Card>
    );
  }

  return (
    <Box className="h-full bg-white dark:bg-slate-900">
      <Center className="h-full">
        <ButtonGroup space="4xl">
          <Button
            onPress={handleLowVisionFlux}
            className="h-auto py-5 px-7 rounded-2xl"
          >
            <ButtonText className="text-2xl">Auxíliar de locomoção</ButtonText>
          </Button>
          <Button
            onPress={() => router.push("/carer")}
            className="h-auto py-5 px-7 rounded-2xl"
          >
            <ButtonText className="text-2xl">Sou cuidador</ButtonText>
          </Button>
          <Button
            onPress={handleCaptureAndProcess}
            className="h-auto py-5 px-7 rounded-2xl bg-blue-500"
          >
            <ButtonText className="text-2xl">Capturar Imagem</ButtonText>
          </Button>
        </ButtonGroup>

        {/* Mostra o alerta se houver mensagem de aviso */}
        {warningMessage && (
          <ProximityAlert
            message={warningMessage}
            onClose={() => setWarningMessage("")}
          />
        )}
      </Center>
    </Box>
  );
}
