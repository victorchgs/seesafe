import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  sendCoapRequest(
    method: string,
    uri: string,
    payload?: string
  ): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("NativeCoapClient");
