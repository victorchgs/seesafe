import { COAP_SERVER_URL } from "@env";
import { Box } from "@/components/ui/box";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import NativeCoapClient from "@/specs/NativeCoapClient";
import useDeviceStore from "@/stores/device";
import { router } from "expo-router";

export default function Index() {
  const { deviceId, setDeviceId } = useDeviceStore();

  const handleLowVisionFlux = () => {
    const payload = JSON.stringify({ deviceId });

    NativeCoapClient?.sendCoapRequest(
      "POST",
      `${COAP_SERVER_URL}/deviceAuth`,
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
