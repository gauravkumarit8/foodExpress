import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ORDER_STATUS_LABEL, OrderStatus, type Order } from '@foodexpress/api-client';
import type { OrdersStackParamList } from '../navigation/types';
import { api } from '../lib/api';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderHistory'>;

const STATUS_COLOR: Record<OrderStatus, { bg: string; fg: string }> = {
  [OrderStatus.PLACED]: { bg: colors.paperDark, fg: colors.ink + 'B3' },
  [OrderStatus.ACCEPTED]: { bg: colors.route[100], fg: colors.route[700] },
  [OrderStatus.PREPARING]: { bg: colors.cook[100], fg: colors.cook[700] },
  [OrderStatus.READY]: { bg: colors.cook[100], fg: colors.cook[700] },
  [OrderStatus.PICKED_UP]: { bg: colors.route[100], fg: colors.route[700] },
  [OrderStatus.DELIVERED]: { bg: colors.pass[100], fg: colors.pass[700] },
  [OrderStatus.CANCELLED]: { bg: colors.ticket[50], fg: colors.ticket[700] },
};

export function OrderHistoryScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.orders
      .mine({ page: 1, limit: 50 })
      .then(async (result) => {
        setOrders(result.data);
        const uniqueIds = Array.from(new Set(result.data.map((o) => o.restaurantId)));
        const entries = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const r = await api.restaurants.get(id);
              return [id, r.name] as const;
            } catch {
              return [id, 'Restaurant'] as const;
            }
          }),
        );
        setRestaurantNames(Object.fromEntries(entries));
      })
      .catch(() => setError('Could not load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Your orders</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: order }) => {
          const c = STATUS_COLOR[order.status];
          return (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('OrderTracking', { id: order.id })}
            >
              <View>
                <Text style={styles.restaurant}>{restaurantNames[order.restaurantId] ?? '…'}</Text>
                <Text style={styles.meta}>
                  {new Date(order.placedAt).toLocaleDateString()} · ₹{order.total.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: c.bg }]}>
                <Text style={[styles.badgeText, { color: c.fg }]}>{ORDER_STATUS_LABEL[order.status]}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No orders yet — your history will show up here.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingTop: 16 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, paddingHorizontal: 20, marginBottom: 8 },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.ticket[500], paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.ink + '80', textAlign: 'center', marginTop: 48 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    backgroundColor: colors.white,
    padding: 14,
    marginBottom: 10,
  },
  restaurant: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink + '66', marginTop: 3 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
});
