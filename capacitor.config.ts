import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifeencoder.chatbox',
  appName: 'دستیار هوشمند',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'http'
  },
  android: {
    appendUserAgent: 'BazaarVersion'
  }
};

export default config;
