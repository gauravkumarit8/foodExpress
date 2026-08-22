import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MenuItem, Restaurant } from '@foodexpress/api-client';
import type { HomeStackParamList } from '../navigation/types';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { MenuItemRow } from '../components/MenuItemRow';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'RestaurantDetail'>;

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const cart = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.restaurants.get(id), api.restaurants.getMenu(id)])
      .then(([r, m]) => {
        setRestaurant(r);
        setMenu(m);
        navigation.setOptions({ title: r.name });
      })
      .catch(() => setError('Could not load this restaurant.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleAdd(item: MenuItem) {
    if (!restaurant) return;
    if (!cart.canAddFrom(restaurant.id)) {
      Alert.alert(
        'Start a new cart?',
        `Your cart has items from ${cart.restaurantName}. Start a new cart for ${restaurant.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start new cart', onPress: () => cart.addItem(restaurant, item) },
        ],
      );
      return;
    }
    cart.addItem(restaurant, item);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }
  if (error || !restaurant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Not found.'}</Text>
      </View>
    );
  }

  const categories = Array.from(new Set(menu.map((m) => m.category || 'Menu')));

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.thumb}>
            {restaurant.imageUrl && <Image source={{ uri: restaurant.imageUrl }} style={styles.thumbImg} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{restaurant.name}</Text>
            {restaurant.description && <Text style={styles.desc}>{restaurant.description}</Text>}
            <Text style={styles.meta}>
              ~{restaurant.avgPrepTimeMinutes} min{restaurant.address ? ` · ${restaurant.address}` : ''}
            </Text>
            {!restaurant.isOpen && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>Currently closed — ordering unavailable</Text>
              </View>
            )}
          </View>
        </View>

        {categories.map((category) => (
          <View key={category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.menuCard}>
              {menu
                .filter((m) => (m.category || 'Menu') === category)
                .map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    quantityInCart={cart.lines.find((l) => l.menuItem.id === item.id)?.quantity ?? 0}
                    onAdd={() => handleAdd(item)}
                  />
                ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {cart.itemCount > 0 && (
        <Pressable style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartBarText}>
            {cart.itemCount} item{cart.itemCount > 1 ? 's' : ''} in cart
          </Text>
          <Text style={styles.cartBarPrice}>₹{cart.subtotal.toFixed(2)}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 100 },
  centered: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.body, color: colors.ink + '80' },
  errorText: { fontFamily: fonts.body, color: colors.ticket[500] },
  headerRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  thumb: { width: 80, height: 80, borderRadius: radius.ticket, backgroundColor: colors.paperDark, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  headerInfo: { flex: 1 },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '99', marginTop: 4 },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink + '80', marginTop: 4 },
  closedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ticket[50],
    borderRadius: radius.ticket,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  closedBadgeText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.ticket[700] },
  categoryBlock: { marginBottom: 20 },
  categoryTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink + '80',
    marginBottom: 6,
  },
  menuCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  cartBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    backgroundColor: colors.ink,
    borderRadius: radius.ticket,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartBarText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.paper },
  cartBarPrice: { fontFamily: fonts.monoMedium, fontSize: 14, color: colors.paper },
});
