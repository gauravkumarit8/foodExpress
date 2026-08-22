import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { UserRole } from '@foodexpress/api-client';
import type { MainTabParamList } from './types';
import { HomeNavigator } from './HomeNavigator';
import { OrdersNavigator } from './OrdersNavigator';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OwnerPlaceholderScreen } from '../screens/OwnerPlaceholderScreen';
import { RiderPlaceholderScreen } from '../screens/RiderPlaceholderScreen';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.ticket[500],
  tabBarInactiveTintColor: colors.ink + '80',
  tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
  tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
} as const;

// Tabs are role-specific: a rider or restaurant owner falling into the
// customer's browse/cart/order tabs is exactly the confusing "wrong app"
// experience this fixes — each role only sees tabs relevant to it.
export function MainTabs() {
  const { user } = useAuth();

  if (user?.role === UserRole.RESTAURANT_OWNER) {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="DashboardTab"
          component={OwnerPlaceholderScreen}
          options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Feather name="shopping-bag" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }}
        />
      </Tab.Navigator>
    );
  }

  if (user?.role === UserRole.RIDER) {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="DeliveriesTab"
          component={RiderPlaceholderScreen}
          options={{ title: 'Deliveries', tabBarIcon: ({ color, size }) => <Feather name="navigation" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }}
        />
      </Tab.Navigator>
    );
  }

  // Customers (and, defensively, any other role) get the ordering flow.
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{ title: 'Browse', tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersNavigator}
        options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Feather name="list" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
