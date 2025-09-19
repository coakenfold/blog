// types/global.d.ts
// Ambient type declaration for extending the global Window interface
declare global {
  interface Window {
    // Third-party libraries that might be loaded via script tags
    gtag: (a: string, b: string, c: unknown) => void;
    dataLayer?: any[];
    webVitalsConfig: Record<string, any>;
    /*
    // Custom properties you might add to window
    myApp?: {
      version: string;
      config: Record<string, any>;
    };
    // Custom functions
    customAnalytics?: {
      track: (event: string, properties?: Record<string, any>) => void;
      identify: (userId: string) => void;
    };
    
    // Environment variables (if injected at build time)
    ENV?: {
      NODE_ENV: 'development' | 'production' | 'test';
      API_URL: string;
      VERSION: string;
    };
    
    // Web APIs that might need additional typing
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
    
    // Development tools
    __REDUX_DEVTOOLS_EXTENSION__?: any;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
    */
  }
}

// This export is necessary to make this file a module
// Without it, TypeScript treats this as a script file
export {};
