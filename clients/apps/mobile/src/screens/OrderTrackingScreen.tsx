import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiError, OrderStatus, type Order } from '@foodexpress/api-client';
import type { HomeStackParamList, OrdersStackParamList } from '../navigation/types';
import { api } from '../lib/api';
import { OrderTicketRail } from '../components/OrderTicketRail';
import { colors, fonts, radius } from '../theme';

// This screen lives in both the Home stack (right after checkout) and the
// Orders stack (opened from history) — accept either navigator's props.
type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'OrderTracking'>,
  NativeStackScreenProps<OrdersStackParamList, 'OrderTracking'>
>;

const POLL_INTERVAL_MS = 6000;
const TERMINAL_STATUSES = new Set<OrderStatus>([OrderStatus.DELIVERED, OrderStatus.CANCELLED]);

function RatingForm({ orderId }: { orderId: string }) {
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'already-rated'>('idle');

  async function submit() {
    setStatus('submitting');
    try {
      await api.orders.rate(orderId, { restaurantRating, comment: comment || undefined });
      setStatus('done');
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 409 ? 'already-rated' : 'idle');
    }
  }

  if (status === 'done') return <Text style={ratingStyles.done}>Thanks for rating your order!</Text>;
  if (status === 'already-rated') return <Text style={ratingStyles.already}>You've already rated this order.</Text>;

  return (
    <View style={ratingStyles.card}>
      <Text style={ratingStyles.title}>Rate this order</Text>
      <View style={ratingStyles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRestaurantRating(n)}
            style={[ratingStyles.star, n <= restaurantRating && ratingStyles.starSelected]}
          >
            <Text style={[ratingStyles.starText, n <= restaurantRating && ratingStyles.starTextSelected]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Any feedback? (optional)"
        multiline
        style={ratingStyles.input}
      />
      <Pressable onPress={submit} disabled={status === 'submitting'} style={ratingStyles.submit}>
        <Text style={ratingStyles.submitText}>Submit rating</Text>
      </Pressable>
    </View>
  );
}

export function OrderTrackingScreen({ route }: Props) {
  const { id } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function fetchOrder() {
      api.orders
        .get(id)
        .then((o) => {
          setOrder(o);
          if (TERMINAL_STATUSES.has(o.status) && timerRef.current) {
            clearInterval(timerRef.current);
          }
        })
        .catch(() => setError('Could not load this order.'));
    }

    fetchOrder();
    timerRef.current = setInterval(fetchOrder, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Track your order</Text>

      <OrderTicketRail order={order} />

      <View style={styles.itemsCard}>
        <Text style={styles.itemsTitle}>Items</Text>
        {(order.items ?? []).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.quantity}× {item.menuItemName ?? 'Item'}
            </Text>
            <Text style={styles.itemPrice}>₹{(item.unitPrice * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={[styles.itemRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{order.total.toFixed(2)}</Text>
        </View>
        <Text style={styles.address}>Delivering to: {order.deliveryAddress}</Text>
        {order.deliveryInstructions && <Text style={styles.note}>Note: {order.deliveryInstructions}</Text>}
      </View>

      {order.status === OrderStatus.DELIVERED && <RatingForm orderId={order.id} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.body, color: colors.ink + '80' },
  errorText: { fontFamily: fonts.body, color: colors.ticket[500] },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 16 },
  itemsCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.ticket, backgroundColor: colors.white, padding: 16, marginTop: 16 },
  itemsTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + 'CC' },
  itemPrice: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink + '99' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 4, paddingTop: 8 },
  totalLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  totalValue: { fontFamily: fonts.monoMedium, fontSize: 14, color: colors.ink },
  address: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '99', marginTop: 8 },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '80' },
});

const ratingStyles = StyleSheet.create({
  done: { fontFamily: fonts.body, fontSize: 13, color: colors.pass[500], marginTop: 16 },
  already: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '80', marginTop: 16 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.ticket, backgroundColor: colors.white, padding: 16, marginTop: 16 },
  title: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  stars: { flexDirection: 'row', gap: 6, marginTop: 8 },
  star: { width: 36, height: 36, borderRadius: radius.ticket, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  starSelected: { borderColor: colors.cook[500], backgroundColor: colors.cook[100] },
  starText: { fontFamily: fonts.mono, fontSize: 14, color: colors.ink + '4D' },
  starTextSelected: { color: colors.cook[700] },
  input: { marginTop: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.ticket, paddingHorizontal: 12, paddingVertical: 8, fontFamily: fonts.body, fontSize: 13, color: colors.ink, minHeight: 44, textAlignVertical: 'top' },
  submit: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: colors.ink, borderRadius: radius.ticket, paddingHorizontal: 16, paddingVertical: 10 },
  submitText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.paper },
});
