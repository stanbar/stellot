declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      HORIZON_SERVER_URL?: string;
      NETWORK_PASSPHRASE?: string;
      PORT?: string;
    }
  }
}

export {};
