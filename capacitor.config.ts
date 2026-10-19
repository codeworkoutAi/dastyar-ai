import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifeencoder.chatbox',
  appName: 'دستیار هوشمند',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'http',
    allowNavigation: [
      'dastyarai.com',
      '*.dastyarai.com',
      'fa-chatbox.com',
      '*.fa-chatbox.com',
      'bazaar-pay.ir',
      '*.bazaar-pay.ir',
      'cafebazaar.ir',
      '*.cafebazaar.ir',
      'shaparak.ir',
      '*.shaparak.ir'
    ]
  },
  android: {
    appendUserAgent: 'BazaarVersion'
  }
};

export default config;
