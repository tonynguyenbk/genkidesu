import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../hooks/useAuth';

type Step = 'phone' | 'otp';

export default function PhoneOTPScreen() {
  const router = useRouter();
  const { saveToken } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<TextInput[]>([]);

  const sendOTP = trpc.auth.sendOTP.useMutation({
    onSuccess: () => setStep('otp'),
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const verifyOTP = trpc.auth.verifyOTP.useMutation({
    onSuccess: async (data) => {
      await saveToken(data.accessToken, data.refreshToken);
      router.replace(data.profiles.length > 0 ? '/(tabs)' : '/profile/create');
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
    if (newOtp.every((d) => d !== '')) {
      verifyOTP.mutate({ phone, otp: newOtp.join('') });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => (step === 'otp' ? setStep('phone') : router.back())} style={styles.back}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>

        {step === 'phone' ? (
          <View style={styles.content}>
            <Text style={styles.title}>Đăng nhập bằng SĐT</Text>
            <TextInput
              style={styles.input}
              placeholder="0912 345 678"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, !phone && styles.btnDisabled]}
              onPress={() => phone && sendOTP.mutate({ phone })}
              disabled={!phone || sendOTP.isPending}
            >
              {sendOTP.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gửi mã</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Nhập mã xác thực</Text>
            <Text style={styles.subtitle}>Đã gửi đến {phone.replace(/(\d{4})\d{3}(\d{3})/, '$1***$2')}</Text>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { if (r) otpRefs.current[i] = r; }}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                />
              ))}
            </View>
            {verifyOTP.isPending && <ActivityIndicator color="#2ECC71" style={{ marginTop: 16 }} />}
            <TouchableOpacity onPress={() => sendOTP.mutate({ phone })}>
              <Text style={styles.resend}>Gửi lại mã</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  back: { padding: 16 },
  backText: { color: '#2ECC71', fontSize: 16 },
  content: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 16, fontSize: 18, backgroundColor: '#fff',
  },
  btn: { backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpInput: {
    width: 48, height: 56, borderWidth: 2, borderColor: '#E5E7EB',
    borderRadius: 12, textAlign: 'center', fontSize: 24, backgroundColor: '#fff',
  },
  resend: { color: '#2ECC71', textAlign: 'center', marginTop: 8 },
});
