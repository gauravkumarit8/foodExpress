import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import { HomeNavigator } from './HomeNavigator';
import { OrdersNavigator } from './OrdersNavigator';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors, fonts } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ticket[500],
        tabBarInactiveTintColor: colors.ink + '80',
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
      }}
    >
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
