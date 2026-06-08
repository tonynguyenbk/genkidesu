import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../hooks/useAuth';

type Step = 'phone' | 'otp';

export default function PhoneOTPScreen() {
  const router = useRouter();
  const { saveToken } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

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
          <Ionicons name="arrow-back" size={22} color="#111827" />
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
                placeholderTextColor="#9CA3AF"
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
                <Ionicons name="code-slash" size={16} color="#7C3AED" />
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
              placeholderTextColor="#D1D5DB"
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  back: { padding: 16 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8, gap: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: -12 },
  bold: { fontWeight: '700', color: '#111827' },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    backgroundColor: '#F9FAFB', paddingHorizontal: 16, height: 56,
  },
  flag: { fontSize: 20, marginRight: 6 },
  countryCode: { fontSize: 16, fontWeight: '600', color: '#374151', marginRight: 4 },
  sep: { width: 1, height: 24, backgroundColor: '#E5E7EB', marginHorizontal: 10 },
  phoneInput: { flex: 1, fontSize: 17, color: '#111827' },

  devBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F3FF', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#C4B5FD',
  },
  devLabel: { fontSize: 12, color: '#7C3AED', marginBottom: 2 },
  devCode: { fontSize: 28, fontWeight: '900', color: '#5B21B6', letterSpacing: 6 },

  otpInput: {
    borderWidth: 2, borderColor: '#2ECC71', borderRadius: 16,
    height: 64, fontSize: 32, fontWeight: '800',
    color: '#111827', backgroundColor: '#F0FDF4',
    letterSpacing: 12,
  },

  btn: {
    backgroundColor: '#2ECC71', padding: 17, borderRadius: 14, alignItems: 'center',
    shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resendBtn: { alignItems: 'center' },
  resendText: { fontSize: 14, color: '#2ECC71', fontWeight: '600' },
});
