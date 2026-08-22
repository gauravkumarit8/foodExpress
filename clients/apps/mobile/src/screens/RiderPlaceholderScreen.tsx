import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

export function RiderPlaceholderScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>🛵</Text>
      </View>
      <Text style={styles.title}>Deliveries are coming soon</Text>
      <Text style={styles.subtitle}>
        Going online, seeing your assignments, and marking pickups/drop-offs will live here once the rider
        workflow is built.
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>In progress</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.route[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: { fontSize: 28 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, textAlign: 'center' },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.ink + '99', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  badge: { marginTop: 16, backgroundColor: colors.cook[100], borderRadius: radius.ticket, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.cook[700] },
});
