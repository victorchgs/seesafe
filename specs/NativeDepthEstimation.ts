import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  getDepthMap(base64Image: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("NativeDepthEstimation");
 