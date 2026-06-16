import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

type Step = 'phone' | 'otp';

export default function PhoneOTPScreen() {
  const router = useRouter();
  const { saveToken } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const sendOTP = trpc.auth.sendOTP.useMutation({
    onSuccess: (data) => {
      setStep('otp');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtp(data.devOtp); // pre-fill
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const verifyOTP = trpc.auth.verifyOTP.useMutation({
    onSuccess: async (data) => {
      await saveToken(data.accessToken, data.refreshToken);
      router.replace(data.profiles.length > 0 ? '/(tabs)' : '/profile/create');
    },
    onError: (e) => Alert.alert('Mã không đúng', e.message),
  });

  const handleVerify = () => {
    if (otp.length !== 6) return;
    verifyOTP.mutate({ phone, otp });
  };

  const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{3,4})/, '$1****$2');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        style={{ flex: 1 }}
      >

        <TouchableOpacity
          onPress={() => step === 'otp' ? setStep('phone') : router.back()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>

        {step === 'phone' ? (
          <View style={styles.content}>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>Nhập số điện thoại để nhận mã xác thực</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.flag}>🇻🇳</Text>
              <Text style={styles.countryCode}>+84</Text>
              <View style={styles.sep} />
              <TextInput
                style={styles.phoneInput}
                placeholder="0912 345 678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoFocus
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, (!phone || sendOTP.isPending) && styles.btnDisabled]}
              onPress={() => phone && sendOTP.mutate({ phone })}
              disabled={!phone || sendOTP.isPending}
            >
              {sendOTP.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Gửi mã xác thực</Text>}
            </TouchableOpacity>
          </View>

        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Nhập mã xác thực</Text>
            <Text style={styles.subtitle}>
              Đã gửi đến <Text style={styles.bold}>{maskedPhone}</Text>
            </Text>

            {devOtp && (
              <View style={styles.devBanner}>
                <Ionicons name="code-slash" size={16} color={theme.colors.info} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.devLabel}>Dev mode — mã của bạn là:</Text>
                  <Text style={styles.devCode}>{devOtp}</Text>
                </View>
              </View>
            )}

            {/* Single text input for 6-digit OTP */}
            <TextInput
              ref={inputRef}
              style={styles.otpInput}
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="------"
              placeholderTextColor={theme.colors.textTertiary}
              textAlign="center"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.btn, (otp.length !== 6 || verifyOTP.isPending) && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={otp.length !== 6 || verifyOTP.isPending}
            >
              {verifyOTP.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Xác nhận</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setOtp(''); sendOTP.mutate({ phone }); }}
              disabled={sendOTP.isPending}
              style={styles.resendBtn}
            >
              <Text style={styles.resendText}>Gửi lại mã</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    back: { padding: 16 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 8, gap: 20 },
    title: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: -12 },
    bold: { fontWeight: '700', color: theme.colors.text },

    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 14,
      backgroundColor: theme.colors.divider, paddingHorizontal: 16, height: 56,
    },
    flag: { fontSize: 20, marginRight: 6 },
    countryCode: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginRight: 4 },
    sep: { width: 1, height: 24, backgroundColor: theme.colors.border, marginHorizontal: 10 },
    phoneInput: { flex: 1, fontSize: 17, color: theme.colors.text },

    devBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: theme.colors.infoBg, borderRadius: 14, padding: 14,
      borderWidth: 1.5, borderColor: theme.colors.info,
    },
    devLabel: { fontSize: 12, color: theme.colors.info, marginBottom: 2 },
    devCode: { fontSize: 28, fontWeight: '900', color: theme.colors.info, letterSpacing: 6 },

    otpInput: {
      borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 16,
      height: 64, fontSize: 32, fontWeight: '800',
      color: theme.colors.text, backgroundColor: theme.colors.surfaceAlt,
      letterSpacing: 12,
    },

    btn: {
      backgroundColor: theme.colors.primary, padding: 17, borderRadius: 14, alignItems: 'center',
      shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    btnDisabled: { backgroundColor: theme.colors.textTertiary, shadowOpacity: 0 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    resendBtn: { alignItems: 'center' },
    resendText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
  });
}
