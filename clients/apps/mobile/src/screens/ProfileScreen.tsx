import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius } from '../theme';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  rider: 'Rider',
  admin: 'Admin',
};

export function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Name</Text>
          <Text style={styles.fieldValue}>{user.name}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{user.email}</Text>
        </View>
        {user.phone && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <Text style={styles.fieldValue}>{user.phone}</Text>
          </View>
        )}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Account type</Text>
          <Text style={styles.fieldValue}>{ROLE_LABEL[user.role] ?? user.role}</Text>
        </View>
      </View>

      {user.role === 'restaurant_owner' && (
        <Text style={styles.note}>The restaurant owner dashboard is coming in the next phase of this app.</Text>
      )}
      {user.role === 'rider' && (
        <Text style={styles.note}>The rider delivery app is coming in the next phase of this app.</Text>
      )}

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, padding: 24, paddingTop: 48 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 20 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.ticket, backgroundColor: colors.white, padding: 20, gap: 16 },
  field: {},
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink + '66' },
  fieldValue: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 2 },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '80', marginTop: 16 },
  logoutButton: { marginTop: 32, alignSelf: 'flex-start' },
  logoutText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ticket[500] },
});
