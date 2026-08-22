import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Restaurant } from '@foodexpress/api-client';
import { colors, fonts, radius } from '../theme';

export function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.thumb}>
        {restaurant.imageUrl && <Image source={{ uri: restaurant.imageUrl }} style={styles.thumbImg} />}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>
        {restaurant.description && (
          <Text style={styles.desc} numberOfLines={1}>
            {restaurant.description}
          </Text>
        )}
        <Text style={styles.meta}>
          ~{restaurant.avgPrepTimeMinutes} min{!restaurant.isOpen ? ' · Closed' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    padding: 12,
    marginBottom: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.ticket,
    backgroundColor: colors.paperDark,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '99', marginTop: 2 },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink + '80', marginTop: 4 },
});
