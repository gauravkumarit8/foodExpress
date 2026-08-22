export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  RestaurantList: undefined;
  RestaurantDetail: { id: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { id: string };
};

export type OrdersStackParamList = {
  OrderHistory: undefined;
  OrderTracking: { id: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};
