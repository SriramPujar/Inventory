import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inventory.app',
  appName: 'Inventory',
  webDir: 'out',
  server: {
    url: 'https://inventory-ten-azure.vercel.app',
    cleartext: true,
    allowNavigation: ['inventory-ten-azure.vercel.app']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
