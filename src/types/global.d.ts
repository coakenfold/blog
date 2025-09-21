// types/global.d.ts
// Ambient type declaration for extending the global Window interface
import { Config } from "../config";
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "consent",
      targetId: string,
      parameters?: { [key: string]: any }
    ) => void;
    dataLayer?: any[];
    "ca.oakenfold.blog": {
      config: Config;
    };
  }
}

// This export is necessary to make this file a module
// Without it, TypeScript treats this as a script file
export {};
