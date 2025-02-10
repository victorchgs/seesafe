import { Box } from "@/components/ui/box";
import NativeCoapClient from "@/specs/NativeCoapClient";
import { COAP_SERVER_URL } from "@env";
import { useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useState } from "react";

// TO DO: melhorar a visualização do mapa, deixar mais dinâmico. E exibir os avisos de queda apropriadamente
// TO DO: padronizar os res.end para satusCode, body: {message, data: {}}

export default function InfosView() {
  const { deviceId } = useLocalSearchParams();
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [didFall, setDidFall] = useState(false);

  const fetchData = () => {
    if (NativeCoapClient) {
      NativeCoapClient.sendRequest(
        "GET",
        `${COAP_SERVER_URL}/sensorsData?deviceId=${deviceId}`,
        true,
        undefined
      )
        .then((response) => {
          const parsedResponse = JSON.parse(response);
          const locationData = parsedResponse.body.data.locationData;

          if (locationData && locationData.coords) {
            const { latitude, longitude } = locationData.coords;
            setLocation({ latitude, longitude });
            setDidFall(parsedResponse.body.data.didFall);

            console.log(parsedResponse.body.data.didFall);
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
    const fetchDataInterval = setInterval(fetchData, 2000);

    return () => clearInterval(fetchDataInterval);
  }, []);

  return (
    <Box className="h-full bg-white dark:bg-slate-900">
      <MapView
        style={{ flex: 1 }}
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
          description={`Detecção de queda: ${didFall ? "Sim" : "Não"}`}
          pinColor={didFall ? "red" : "green"}
        />
      </MapView>
    </Box>
  );
}
