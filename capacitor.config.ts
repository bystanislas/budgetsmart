import type { CapacitorConfig } from '@capacitor/cli'

/** Empaquetage mobile de Budget Smart by APEX AFRICA. */
const config: CapacitorConfig = {
  appId: 'com.apxafrica.budgetsmart',
  appName: 'Budget Smart',
  webDir: 'dist',
  android: {
    backgroundColor: '#1A3557',
  },
  ios: {
    backgroundColor: '#1A3557',
    contentInset: 'always',
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
