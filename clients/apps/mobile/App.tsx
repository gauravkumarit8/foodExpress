import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFonts as useIbmPlexMono, IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op — fails harmlessly if called more than once during fast refresh
});

export default function App() {
  const [spaceGroteskLoaded] = useSpaceGrotesk({ SpaceGrotesk_500Medium, SpaceGrotesk_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [plexMonoLoaded] = useIbmPlexMono({ IBMPlexMono_400Regular, IBMPlexMono_500Medium });

  const fontsReady = spaceGroteskLoaded && interLoaded && plexMonoLoaded;

  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    if (fontsReady) setAppReady(true);
  }, [fontsReady]);

  const onLayoutRootView = useCallback(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  if (!appReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </View>
  );
}
