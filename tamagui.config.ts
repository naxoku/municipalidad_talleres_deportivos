import { createTamagui } from 'tamagui'
import { defaultConfig } from '@tamagui/config/v4'

const config = createTamagui(defaultConfig)

type Conf = typeof config

// make imports typed
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config