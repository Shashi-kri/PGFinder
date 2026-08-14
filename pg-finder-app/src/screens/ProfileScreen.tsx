// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, font, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<RootTabParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, signIn, signUp, signOut } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const closeModal = () => {
    setModalVisible(false);
    setLoginEmail(''); setLoginPassword('');
    setRegName(''); setRegEmail(''); setRegPhone('');
    setRegPassword(''); setRegConfirm('');
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      Alert.alert('Required', 'Please enter your email and password.'); return;
    }
    setBusy(true);
    try {
      await signIn(loginEmail.trim(), loginPassword);
      closeModal();
    } catch (err: any) {
      Alert.alert('Login Failed', err.message ?? 'Invalid email or password');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      Alert.alert('Required', 'Name, email and password are required.'); return;
    }
    if (regPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return;
    }
    if (regPassword !== regConfirm) {
      Alert.alert('Mismatch', 'Passwords do not match.'); return;
    }
    setBusy(true);
    try {
      await signUp(regName.trim(), regEmail.trim(), regPassword, regPhone.trim() || undefined);
      closeModal();
      Alert.alert('Welcome! 🎉', `Account created for ${regName.trim()}`);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message ?? 'Could not create account');
    } finally {
      setBusy(false);
    }
  };

  const rows = [
    {
      icon: '🏠',
      label: 'Post a Listing',
      hint: 'List your PG, Flat, Flatmate room or Mess',
      onPress: () => navigation.getParent()?.navigate('CreateListing'),
    },
    {
      icon: '👤',
      label: 'Seeker Profile',
      hint: 'Preferences used for matching',
      onPress: () => navigation.getParent()?.navigate('EditProfile'),
    },
    {
      icon: '❤️',
      label: 'Saved Places',
      hint: 'Your shortlisted properties',
      onPress: () => navigation.getParent()?.navigate('SavedListings'),
    },
    { icon: '✅', label: 'ID Verification', hint: 'Student / professional ID badge' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarText}>{user ? user.name[0].toUpperCase() : '?'}</Text>
          </View>
          <Text style={styles.name}>{user ? user.name : 'Guest'}</Text>
          <Text style={styles.sub}>
            {user ? user.email : 'Sign in to sync listings & matches'}
          </Text>
          {user && (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: user.role === 'owner' ? '#FEF3C7' : '#EEF2FF' }]}>
                <Text style={[styles.badgeText, { color: user.role === 'owner' ? '#92400E' : '#4338CA' }]}>
                  {user.role === 'owner' ? '🏠 Owner' : '🔍 Seeker'}
                </Text>
              </View>
            </View>
          )}

          {user ? (
            <Pressable style={styles.signOutBtn} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.signInBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.signInText}>Sign In / Create Account</Text>
            </Pressable>
          )}
        </View>

        {/* Menu rows */}
        {rows.map((r) => (
          <Pressable key={r.label} style={styles.row} onPress={r.onPress}>
            <Text style={styles.rowIcon}>{r.icon}</Text>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowHint}>{r.hint}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Auth Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modalCard}>
            {/* Tab switcher */}
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, tab === 'login' && styles.tabActive]}
                onPress={() => setTab('login')}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, tab === 'register' && styles.tabActive]}
                onPress={() => setTab('register')}
              >
                <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                  Create Account
                </Text>
              </Pressable>
            </View>

            {tab === 'login' ? (
              <>
                <TextInput
                  style={styles.input} placeholder="Email" value={loginEmail}
                  onChangeText={setLoginEmail} keyboardType="email-address"
                  autoCapitalize="none" placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input} placeholder="Password" value={loginPassword}
                  onChangeText={setLoginPassword} secureTextEntry
                  placeholderTextColor={colors.textMuted}
                />
                <Pressable style={styles.primaryBtn} onPress={handleLogin} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> :
                    <Text style={styles.primaryBtnText}>Sign In</Text>}
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input} placeholder="Full Name" value={regName}
                  onChangeText={setRegName} placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input} placeholder="Email" value={regEmail}
                  onChangeText={setRegEmail} keyboardType="email-address"
                  autoCapitalize="none" placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input} placeholder="Phone (optional)" value={regPhone}
                  onChangeText={setRegPhone} keyboardType="phone-pad"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input} placeholder="Password (min 6 chars)" value={regPassword}
                  onChangeText={setRegPassword} secureTextEntry
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input} placeholder="Confirm Password" value={regConfirm}
                  onChangeText={setRegConfirm} secureTextEntry
                  placeholderTextColor={colors.textMuted}
                />
                <Pressable style={styles.primaryBtn} onPress={handleRegister} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> :
                    <Text style={styles.primaryBtnText}>Create Account</Text>}
                </Pressable>
              </>
            )}

            <Pressable style={styles.cancelBtn} onPress={closeModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  headerCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  avatarRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.base, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', marginTop: spacing.sm },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: font.sm, fontWeight: '700' },
  signInBtn: {
    marginTop: spacing.md, backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
  },
  signInText: { color: '#fff', fontWeight: '700', fontSize: font.base },
  signOutBtn: {
    marginTop: spacing.md, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  signOutText: { color: colors.danger, fontWeight: '700', fontSize: font.sm },
  row: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.lg, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  rowIcon: { fontSize: 22 },
  rowLeft: { flex: 1, gap: 2 },
  rowLabel: { fontSize: font.md, fontWeight: '700', color: colors.text },
  rowHint: { fontSize: font.sm, color: colors.textMuted },
  chev: { fontSize: 28, color: colors.textMuted },
  // Modal
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md,
    paddingBottom: spacing.xl + 20,
  },
  tabs: {
    flexDirection: 'row', backgroundColor: colors.bg,
    borderRadius: radius.md, padding: 4, marginBottom: spacing.sm,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: font.md, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: '#fff' },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, fontSize: font.md, color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.sm,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: font.md },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { color: colors.textMuted, fontWeight: '600', fontSize: font.base },
});
