import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await login({ email, password });
      // On success AuthContext's `user` flips truthy, and RootNavigator
      // swaps to MainTabs automatically — nothing to navigate to here.
    } catch {
      // error is already surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.subtitle}>Welcome back — let's get you fed.</Text>

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
        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable onPress={handleSubmit} disabled={submitting} style={styles.button}>
        <Text style={styles.buttonText}>{submitting ? 'Signing in…' : 'Log in'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
        <Text style={styles.linkText}>
          New here? <Text style={styles.linkAccent}>Create an account</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, padding: 24, justifyContent: 'center' },
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
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.ticket[500], marginBottom: 12 },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radius.ticket,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.paper },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '99' },
  linkAccent: { color: colors.ticket[500], fontFamily: fonts.bodyMedium },
});
