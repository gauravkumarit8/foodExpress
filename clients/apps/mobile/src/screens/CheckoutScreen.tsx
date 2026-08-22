import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiError } from '@foodexpress/api-client';
import type { HomeStackParamList } from '../navigation/types';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { getCurrentPosition } from '../lib/geolocation';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Checkout'>;

const DELIVERY_FEE = 30; // matches the backend's flat placeholder fee — shown so the total isn't a surprise

export function CheckoutScreen({ navigation }: Props) {
  const cart = useCart();
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPosition().then((c) => {
      setCoords(c);
      setLocating(false);
    });
  }, []);

  useEffect(() => {
    if (cart.lines.length === 0 || !cart.restaurantId) {
      navigation.replace('Cart');
    }
  }, [cart.lines.length, cart.restaurantId, navigation]);

  async function handleSubmit() {
    if (!coords) {
      setError('We need your delivery location — enable location access and try again.');
      return;
    }
    if (!cart.restaurantId) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.orders.create({
        restaurantId: cart.restaurantId,
        items: cart.lines.map((l) => ({
          menuItemId: l.menuItem.id,
          quantity: l.quantity,
          notes: l.notes || undefined,
        })),
        deliveryAddress: address,
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        deliveryInstructions: instructions || undefined,
      });
      cart.clear();
      navigation.replace('OrderTracking', { id: order.id });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place your order. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Delivery address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Flat / house no., street, area"
          multiline
          style={[styles.input, styles.textarea]}
        />
        <Text style={styles.hint}>
          {locating
            ? 'Getting your location…'
            : coords
              ? 'Using your current location for delivery routing.'
              : 'Location unavailable — enable it in Settings to place an order.'}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Delivery instructions (optional)</Text>
        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g. Leave at the door"
          maxLength={300}
          style={styles.input}
        />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{cart.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery fee</Text>
          <Text style={styles.summaryValue}>₹{DELIVERY_FEE.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{(cart.subtotal + DELIVERY_FEE).toFixed(2)}</Text>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting || locating || !address}
        style={[styles.button, (submitting || locating || !address) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{submitting ? 'Placing order…' : 'Place order'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.ink + '66', marginTop: 4 },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + 'B3' },
  summaryValue: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink + 'B3' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 4, paddingTop: 8 },
  totalLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  totalValue: { fontFamily: fonts.monoMedium, fontSize: 14, color: colors.ink },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.ticket[500], marginTop: 12 },
  button: { backgroundColor: colors.ink, borderRadius: radius.ticket, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.paper },
});
