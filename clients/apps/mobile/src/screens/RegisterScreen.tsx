import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserRole, type SelfRegisterableRole } from '@foodexpress/api-client';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const ROLE_OPTIONS: { value: SelfRegisterableRole; label: string }[] = [
  { value: UserRole.CUSTOMER, label: 'Order food' },
  { value: UserRole.RESTAURANT_OWNER, label: 'Run a restaurant' },
  { value: UserRole.RIDER, label: 'Deliver orders' },
];

export function RegisterScreen({ navigation }: Props) {
  const { register, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SelfRegisterableRole>(UserRole.CUSTOMER);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await register({ name, email, phone: phone || undefined, password, role });
    } catch {
      // error is already surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.subtitle}>Takes less than a minute.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Phone (optional)</Text>
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        <Text style={styles.hint}>At least 8 characters.</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>I want to…</Text>
        {ROLE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setRole(opt.value)}
            style={[styles.roleOption, role === opt.value && styles.roleOptionSelected]}
          >
            <View style={[styles.radio, role === opt.value && styles.radioSelected]} />
            <Text style={styles.roleLabel}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable onPress={handleSubmit} disabled={submitting} style={styles.button}>
        <Text style={styles.buttonText}>{submitting ? 'Creating account…' : 'Create account'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkAccent}>Log in</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.ink + '99', marginTop: 4, marginBottom: 24 },
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
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.ink + '66', marginTop: 4 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  roleOptionSelected: { borderColor: colors.ticket[500], backgroundColor: colors.ticket[50] },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.line },
  radioSelected: { borderColor: colors.ticket[500], backgroundColor: colors.ticket[500] },
  roleLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.ticket[500], marginBottom: 12 },
  button: { backgroundColor: colors.ink, borderRadius: radius.ticket, paddingVertical: 14, alignItems: 'center' },
  buttonText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.paper },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '99' },
  linkAccent: { color: colors.ticket[500], fontFamily: fonts.bodyMedium },
});
