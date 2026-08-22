import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MenuItem } from '@foodexpress/api-client';
import { colors, fonts, radius } from '../theme';

export function MenuItemRow({
  item,
  quantityInCart,
  onAdd,
}: {
  item: MenuItem;
  quantityInCart: number;
  onAdd: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description && <Text style={styles.desc}>{item.description}</Text>}
        <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
      </View>
      <Pressable
        onPress={onAdd}
        disabled={!item.isAvailable}
        style={[styles.button, !item.isAvailable && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !item.isAvailable && styles.buttonTextDisabled]}>
          {item.isAvailable ? 'Add' : 'Unavailable'}
        </Text>
        {quantityInCart > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{quantityInCart}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 12,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '99', marginTop: 2 },
  price: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink + 'CC', marginTop: 4 },
  button: {
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: radius.ticket,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  buttonDisabled: { borderColor: colors.line },
  buttonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  buttonTextDisabled: { color: colors.ink + '4D' },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ticket[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.mono, fontSize: 11, color: colors.white },
});
