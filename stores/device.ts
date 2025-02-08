import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type DeviceState = {
  deviceId: string;
  shareCode: string;
  setDeviceId: (deviceId: string) => void;
  setShareCode: (shareCode: string) => void;
};

const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      deviceId: "",
      shareCode: "",
      setDeviceId: (deviceId) => set({ deviceId: deviceId }),
      setShareCode: (shareCode) => set({ shareCode: shareCode }),
    }),
    {
      name: "device-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useDeviceStore;
