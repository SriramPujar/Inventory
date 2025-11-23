import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inventory.app',
  appName: 'inventory',
  webDir: 'out',
  server: {
    url: 'https://inventory-h54h3t9ip-srirampujar-2236s-projects.vercel.app', // Production URL
    cleartext: true
  }
};

export default config;
