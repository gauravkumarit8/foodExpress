import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from './types';
import { OrderHistoryScreen } from '../screens/OrderHistoryScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { colors, fonts } from '../theme';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.displayMedium },
  headerShadowVisible: false,
};

export function OrdersNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Your orders' }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Order status' }} />
    </Stack.Navigator>
  );
}
