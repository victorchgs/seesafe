import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  analyzeImage(base64Image: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("NativeDetectionDepth");
