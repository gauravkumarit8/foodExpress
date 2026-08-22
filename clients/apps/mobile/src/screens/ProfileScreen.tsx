import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius } from '../theme';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  rider: 'Rider',
  admin: 'Admin',
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(user.name)}</Text>
        </View>
        <View>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABEL[user.role] ?? user.role}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
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
      </View>

      <Pressable style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.6 }]} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, padding: 24, paddingTop: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 18, color: colors.paper },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paperDark,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleBadgeText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.ink + '99' },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.ticket, backgroundColor: colors.white, padding: 20, gap: 16 },
  field: {},
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink + '66' },
  fieldValue: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 2 },
  logoutButton: { marginTop: 32, alignSelf: 'flex-start' },
  logoutText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ticket[500] },
});
