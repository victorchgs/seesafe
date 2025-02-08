import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  sendRequest(
    method: string,
    endpoint: string,
    isCritical: boolean,
    payload?: string
  ): Promise<string>;

  setConfiguration(options: { timeout: number; maxRetries: number }): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>("NativeCoapClient");
