import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MenuItem } from '@foodexpress/api-client';
import { colors, fonts, radius } from '../theme';

export function MenuItemRow({
  item,
  quantityInCart,
  onAdd,
  onDecrement,
}: {
  item: MenuItem;
  quantityInCart: number;
  /** Omit both to render the row read-only. */
  onAdd?: () => void;
  onDecrement?: () => void;
}) {
  const canOrder = !!onAdd;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description && <Text style={styles.desc}>{item.description}</Text>}
        <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
      </View>

      {canOrder &&
        (quantityInCart > 0 ? (
          <View style={styles.stepper}>
            <Pressable
              onPress={onDecrement}
              hitSlop={8}
              style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperButtonPressed]}
            >
              <Text style={styles.stepperButtonText}>−</Text>
            </Pressable>
            <Text style={styles.stepperCount}>{quantityInCart}</Text>
            <Pressable
              onPress={onAdd}
              disabled={!item.isAvailable}
              hitSlop={8}
              style={({ pressed }) => [
                styles.stepperButton,
                pressed && styles.stepperButtonPressed,
                !item.isAvailable && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAdd}
            disabled={!item.isAvailable}
            style={({ pressed }) => [
              styles.button,
              !item.isAvailable && styles.buttonDisabled,
              pressed && item.isAvailable && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, !item.isAvailable && styles.buttonTextDisabled]}>
              {item.isAvailable ? 'Add' : 'Unavailable'}
            </Text>
          </Pressable>
        ))}
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
  buttonPressed: { backgroundColor: colors.ink },
  buttonDisabled: { borderColor: colors.line },
  buttonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  buttonTextDisabled: { color: colors.ink + '4D' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.ticket[500],
    backgroundColor: colors.ticket[50],
    borderRadius: radius.ticket,
    padding: 3,
  },
  stepperButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.ticket,
  },
  stepperButtonPressed: { backgroundColor: colors.white },
  stepperButtonText: { fontFamily: fonts.monoMedium, fontSize: 16, color: colors.ticket[700] },
  stepperCount: {
    width: 20,
    textAlign: 'center',
    fontFamily: fonts.monoMedium,
    fontSize: 14,
    color: colors.ticket[700],
  },
});
