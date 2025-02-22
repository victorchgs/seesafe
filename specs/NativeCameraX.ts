import { TurboModule, TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  captureImage(): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("NativeCameraX");
