import { Accelerometer } from "expo-sensors";

let accelerometerSubscription: any = null;

export function startAccelerometer(setData: (data: any) => void) {
  Accelerometer.isAvailableAsync().then((available) => {
    if (available) {
      accelerometerSubscription = Accelerometer.addListener((data) => {
        setData(data);
      });
    } else {
      console.error("Acelerômetro não está disponível.");
    }
  });
}

export function stopAccelerometer() {
  if (accelerometerSubscription) {
    accelerometerSubscription.remove();
    accelerometerSubscription = null;
  }
}
