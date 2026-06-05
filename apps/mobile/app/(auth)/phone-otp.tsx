import { useState, useRef, useEffect } from 'react';
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
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const sendOTP = trpc.auth.sendOTP.useMutation({
    onSuccess: (data) => {
      setStep('otp');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        // Auto-fill OTP in dev mode
        const digits = data.devOtp.split('');
        setOtp(digits);
      }
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

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otp.every((d) => d !== '') && step === 'otp') {
      verifyOTP.mutate({ phone, otp: otp.join('') });
    }
  }, [otp]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last char
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{3,4})/, '$1****$2');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        <TouchableOpacity onPress={() => step === 'otp' ? setStep('phone') : router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        {step === 'phone' ? (
          <View style={styles.content}>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>Nhập số điện thoại để nhận mã xác thực</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.flag}>🇻🇳 +84</Text>
              <View style={styles.divider} />
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
                : <Text style={styles.btnText}>Gửi mã xác thực</Text>
              }
            </TouchableOpacity>

            <Text style={styles.note}>Mã OTP gồm 6 chữ số sẽ được gửi qua SMS</Text>
          </View>

        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Nhập mã xác thực</Text>
            <Text style={styles.subtitle}>Đã gửi đến <Text style={{ fontWeight: '700', color: '#111827' }}>{maskedPhone}</Text></Text>

            {/* Dev mode banner */}
            {devOtp && (
              <View style={styles.devBanner}>
                <Ionicons name="code-slash" size={16} color="#7C3AED" />
                <Text style={styles.devText}>
                  Dev mode — OTP: <Text style={styles.devOtp}>{devOtp}</Text>
                </Text>
                <Text style={styles.devSub}>(đã tự điền)</Text>
              </View>
            )}

            {/* OTP boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { otpRefs.current[i] = r; }}
                  style={[styles.otpBox, digit && styles.otpBoxFilled]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  selectTextOnFocus
                />
              ))}
            </View>

            {verifyOTP.isPending && (
              <View style={styles.verifying}>
                <ActivityIndicator color="#2ECC71" size="small" />
                <Text style={styles.verifyingText}>Đang xác thực...</Text>
              </View>
            )}

            {!devOtp && (
              <TouchableOpacity
                onPress={() => sendOTP.mutate({ phone })}
                disabled={sendOTP.isPending}
                style={styles.resendBtn}
              >
                <Text style={styles.resendText}>Gửi lại mã</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btn, (otp.some((d) => !d) || verifyOTP.isPending) && styles.btnDisabled]}
              onPress={() => verifyOTP.mutate({ phone, otp: otp.join('') })}
              disabled={otp.some((d) => !d) || verifyOTP.isPending}
            >
              {verifyOTP.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Xác nhận</Text>
              }
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
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: -8 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    backgroundColor: '#F9FAFB', paddingHorizontal: 16, height: 56,
  },
  flag: { fontSize: 16, marginRight: 8 },
  divider: { width: 1, height: 24, backgroundColor: '#E5E7EB', marginRight: 12 },
  phoneInput: { flex: 1, fontSize: 17, color: '#111827' },

  btn: {
    backgroundColor: '#2ECC71', padding: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: '#2ECC71', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  btnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },

  devBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F3FF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  devText: { fontSize: 13, color: '#5B21B6', flex: 1 },
  devOtp: { fontSize: 15, fontWeight: '800', color: '#7C3AED', letterSpacing: 3 },
  devSub: { fontSize: 11, color: '#8B5CF6' },

  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 8 },
  otpBox: {
    width: 48, height: 58, borderWidth: 2, borderColor: '#E5E7EB',
    borderRadius: 14, textAlign: 'center', fontSize: 24, fontWeight: '700',
    color: '#111827', backgroundColor: '#F9FAFB',
  },
  otpBoxFilled: { borderColor: '#2ECC71', backgroundColor: '#F0FDF4' },

  verifying: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  verifyingText: { fontSize: 14, color: '#2ECC71' },
  resendBtn: { alignItems: 'center' },
  resendText: { fontSize: 14, color: '#2ECC71', fontWeight: '600' },
});
