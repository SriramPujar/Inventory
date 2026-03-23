import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inventory.app',
  appName: 'Inventory',
  webDir: 'out',
  server: {
    url: 'https://inventory-ten-azure.vercel.app',
    cleartext: true
  }
};

export default config;
