declare module "next-pwa" {
  import type { NextConfig } from "next";
  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: unknown[];
    buildExcludes?: RegExp[];
    publicExcludes?: string[];
  }
  export default function (config: PWAConfig): (config: NextConfig) => NextConfig;
}
