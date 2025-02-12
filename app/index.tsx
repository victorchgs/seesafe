import { Box } from "@/components/ui/box";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import NativeCoapClient from "@/specs/NativeCoapClient";
import useDeviceStore from "@/stores/device";
import { router } from "expo-router";

export default function Index() {
  const { deviceId, setDeviceId, shareCode, setShareCode } = useDeviceStore();

  const handleLowVisionFlux = () => {
    const payload = JSON.stringify({ deviceId, shareCode });

    if (NativeCoapClient) {
      NativeCoapClient?.sendRequest(
        "POST",
        "192.168.1.3:5683/deviceAuth",
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

  return (
    <Box className="h-full bg-white dark:bg-slate-900">
      <Center className="h-full">
        <ButtonGroup space="4xl">
          <Button
            onPress={() => {
              handleLowVisionFlux();
            }}
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
