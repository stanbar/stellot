declare module 'vfile-message' {
  export type VFileMessage = any;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
    }
  }
}

export {};
