import { networkConfig } from "./networks";
import { AppConfig } from "./types";
import * as constants from "./constants";

export * from "./types";

export const appConfig: AppConfig = {
  networks: networkConfig,
  constants
}