import { Box } from "@/components/ui/box";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import NativeCoapClient from "@/specs/NativeCoapClient";
import NativeCameraX from "@/specs/NativeCameraX";
import NativeDepthEstimation from "@/specs/NativeDepthEstimation";
import useDeviceStore from "@/stores/device";
import { router } from "expo-router";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";

export default function Index() {
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

      const depthMap = await NativeDepthEstimation.getDepthMap(base64Image);
      console.log("Mapa de profundidade:", depthMap);
    } catch (error) {
      console.error("Erro ao capturar/processar imagem:", error);
    }
  };

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
      </Center>
    </Box>
  );
}
