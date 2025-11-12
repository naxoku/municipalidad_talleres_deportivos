import React from "react";
import { TamaguiProvider } from 'tamagui'
import config from './tamagui.config'
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <TamaguiProvider config={config}>
      <AppNavigator />
    </TamaguiProvider>
  )
}