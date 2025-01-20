import { Gyroscope } from "expo-sensors";

let gyroscopeSubscription: any = null;

export function startGyroscope(setData: (data: any) => void) {
  Gyroscope.isAvailableAsync().then((available) => {
    if (available) {
      gyroscopeSubscription = Gyroscope.addListener((data) => {
        setData(data);
      });
    } else {
      console.error("Giroscópio não está disponível.");
    }
  });
}

export function stopGyroscope() {
  if (gyroscopeSubscription) {
    gyroscopeSubscription.remove();
    gyroscopeSubscription = null;
  }
}
