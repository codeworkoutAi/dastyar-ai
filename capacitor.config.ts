import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifeencoder.chatbox',
  appName: 'دستیار هوشمند',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    }
  },
  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
