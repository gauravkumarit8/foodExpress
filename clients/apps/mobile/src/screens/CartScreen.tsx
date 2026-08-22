import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import { useCart } from '../context/CartContext';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const cart = useCart();

  if (cart.lines.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Find something good to eat.</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('RestaurantList')}>
          <Text style={styles.buttonText}>Browse restaurants</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your cart</Text>
        <Text style={styles.subtitle}>From {cart.restaurantName}</Text>

        <View style={styles.card}>
          {cart.lines.map((line) => (
            <View key={line.menuItem.id} style={styles.line}>
              <View style={styles.lineTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{line.menuItem.name}</Text>
                  <Text style={styles.itemPrice}>₹{line.menuItem.price.toFixed(2)}</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => cart.updateQuantity(line.menuItem.id, line.quantity - 1)}
                  >
                    <Text style={styles.stepperText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperCount}>{line.quantity}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => cart.updateQuantity(line.menuItem.id, line.quantity + 1)}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>
              <TextInput
                placeholder="Add a note (e.g. no onions)"
                value={line.notes ?? ''}
                onChangeText={(text) => cart.setNotes(line.menuItem.id, text)}
                maxLength={200}
                style={styles.noteInput}
              />
            </View>
          ))}
        </View>

        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>₹{cart.subtotal.toFixed(2)}</Text>
        </View>
        <Text style={styles.feeHint}>+ delivery fee at checkout</Text>

        <Pressable style={styles.button} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.buttonText}>Proceed to checkout</Text>
        </Pressable>
        <Pressable style={styles.clearButton} onPress={cart.clear}>
          <Text style={styles.clearButtonText}>Clear cart</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 48 },
  emptyScreen: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  emptySubtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.ink + '99', marginTop: 4, marginBottom: 20 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '99', marginTop: 2, marginBottom: 16 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.ticket, backgroundColor: colors.white, paddingHorizontal: 14 },
  line: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  lineTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemName: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  itemPrice: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink + '99', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radius.ticket,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontFamily: fonts.mono, fontSize: 16, color: colors.ink },
  stepperCount: { fontFamily: fonts.mono, fontSize: 14, color: colors.ink, minWidth: 18, textAlign: 'center' },
  noteInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    backgroundColor: colors.paper,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  subtotalLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  subtotalValue: { fontFamily: fonts.monoMedium, fontSize: 14, color: colors.ink },
  feeHint: { fontFamily: fonts.body, fontSize: 11, color: colors.ink + '66', textAlign: 'right', marginTop: 4 },
  button: { backgroundColor: colors.ink, borderRadius: radius.ticket, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.paper },
  clearButton: { alignItems: 'center', marginTop: 12 },
  clearButtonText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '66' },
});
