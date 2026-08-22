import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function OwnerPlaceholderScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>🏪</Text>
      </View>
      <Text style={styles.title}>Manage from the web</Text>
      <Text style={styles.subtitle}>
        Your restaurant dashboard — menu editing and incoming orders — lives on the FoodExpress web app.
        This mobile app is for customers ordering food.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cook[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: { fontSize: 28 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, textAlign: 'center' },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.ink + '99', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
