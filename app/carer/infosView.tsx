import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon, CloseIcon, Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import NativeCoapClient from "@/specs/NativeCoapClient";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useState } from "react";

// TO DO: melhorar a visualização do mapa, deixar mais dinâmico. E exibir os avisos de queda apropriadamente
// TO DO: padronizar os res.end para satusCode, body: {message, data: {}}

function FallAlert({ onClose }: { onClose: () => void }) {
  return (
    <Card variant="outline" className="m-4 p-0 border-red-500">
      <HStack space="md">
        <Box className="bg-red-500 w-1 h-full" />
        <VStack space="sm" className="py-2 pr-8">
          <HStack className="justify-between items-center w-full">
            <Heading>Uma queda foi detectada</Heading>
            <Pressable onPress={onClose}>
              <Icon as={CloseIcon} />
            </Pressable>
          </HStack>
          <Text>
            Se o usuário continuar a se mover, desconsidere este aviso
          </Text>
        </VStack>
      </HStack>
    </Card>
  );
}

export default function InfosView() {
  const { deviceId } = useLocalSearchParams();
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [showFallAlert, setShowFallAlert] = useState(false);

  const fetchData = () => {
    if (NativeCoapClient) {
      NativeCoapClient?.sendRequest(
        "GET",
        `192.168.0.194:5683/sensorsData?deviceId=${deviceId}`,
        true,
        undefined
      )
        .then((response) => {
          const parsedResponse = JSON.parse(response);
          const locationData = parsedResponse.body.data.locationData;

          if (locationData && locationData.coords) {
            const { latitude, longitude } = locationData.coords;
            setLocation({ latitude, longitude });

            if (parsedResponse.body.data.didFall && !showFallAlert) {
              setShowFallAlert(true);
            }
          }
        })
        .catch((error) => {
          console.log("Erro ao buscar dados do dispositivo:", error);
        });
    } else {
      console.log("NativeCoapClient não está disponível");
    }
  };

  useEffect(() => {
    fetchData();
    const fetchDataInterval = setInterval(fetchData, 5000);

    return () => clearInterval(fetchDataInterval);
  }, []);

  return (
    <Box className="h-full bg-white dark:bg-slate-900">
      <Box className="absolute top-4 left-4 z-10">
        <Pressable onPress={() => router.back()}>
          <Icon as={ArrowLeftIcon} size="lg" />
        </Pressable>
      </Box>
      <MapView
        style={{ height: 500 }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={location}
          title="Localização da PCDV"
          description="Monitoramento em tempo real"
        />
      </MapView>
      {showFallAlert && <FallAlert onClose={() => setShowFallAlert(false)} />}
    </Box>
  );
}
