import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Center } from "@/components/ui/center";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { AlertCircleIcon, ArrowLeftIcon, Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import NativeCoapClient from "@/specs/NativeCoapClient";
import { router } from "expo-router";
import { useState } from "react";

export default function Index() {
  const [code, setCode] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = () => {
    if (!code.trim()) {
      setIsInvalid(true);
      setErrorMessage("Insira algum código.");

      return;
    }

    const payload = JSON.stringify({ code });

    if (NativeCoapClient) {
      NativeCoapClient?.sendRequest(
        "POST",
        "192.168.1.3:5683/shareCodeValidation",
        true,
        payload
      )
        .then((response) => {
          const parsedResponse = JSON.parse(response);
          const data = parsedResponse.body.data;

          if (data?.deviceId) {
            router.push({
              pathname: "/carer/infosView",
              params: { deviceId: data.deviceId },
            });
            setCode("");
          } else {
            setIsInvalid(true);
            setErrorMessage("Código inválido. Por favor, tente novamente.");
          }
        })
        .catch((error) => {
          console.log("Erro ao enviar requisição CoAP:", error);
        });
    } else {
      console.log("NativeCoapClient não está disponível");
    }
  };

  const handleInputChange = (text: string) => {
    setCode(text);

    if (isInvalid) {
      setIsInvalid(false);
      setErrorMessage("");
    }
  };

  return (
    <Box className="bg-white dark:bg-slate-900">
      <Center className="h-full">
        <Card variant="elevated" className="max-w-[80%]">
          <VStack space="2xl">
            <VStack space="sm">
              <Pressable onPress={() => router.back()}>
                <Icon as={ArrowLeftIcon} size="lg" />
              </Pressable>
              <Heading size="lg">Informe o código para continuar</Heading>
              <Text size="lg">
                Este é o código disponível no aplicativo da PCDV
              </Text>
            </VStack>
            <VStack space="xl">
              <FormControl isInvalid={isInvalid} size="md">
                <FormControlLabel>
                  <FormControlLabelText>Código</FormControlLabelText>
                </FormControlLabel>
                <Input className="my-1" size="lg">
                  <InputField
                    type="text"
                    placeholder="seesafe/exemplo"
                    value={code}
                    onChangeText={handleInputChange}
                  />
                </Input>
                {isInvalid && (
                  <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText>{errorMessage}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
              <Button onPress={handleSubmit}>
                <ButtonText>Confirmar</ButtonText>
              </Button>
            </VStack>
          </VStack>
        </Card>
      </Center>
    </Box>
  );
}
