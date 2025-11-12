import 'tsx/cjs'; // Add this to import TypeScript files
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'municipalidad_talleres_deportivos',
  slug: 'municipalidad_talleres_deportivos',
  "plugins": [
    [
      "expo-asset",
      {
        "assets": ["./src/assets/images/logo_omd.png"]
      }
    ]
  ]
};

export default config;
