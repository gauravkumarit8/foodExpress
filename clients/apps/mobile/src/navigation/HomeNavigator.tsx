import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import { RestaurantListScreen } from '../screens/RestaurantListScreen';
import { RestaurantDetailScreen } from '../screens/RestaurantDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { colors, fonts } from '../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.displayMedium },
  headerShadowVisible: false,
};

export function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="RestaurantList" component={RestaurantListScreen} options={{ title: 'FoodExpress' }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Order status' }} />
    </Stack.Navigator>
  );
}
