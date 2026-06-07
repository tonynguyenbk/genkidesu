import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../hooks/useAuth';
import { useGoogleAuthRequest, useFacebookAuthRequest, isGoogleConfigured, isFacebookConfigured } from '../../lib/oauth';

export default function LoginScreen() {
  const router = useRouter();
  const { saveToken } = useAuth();
  const [pending, setPending] = useState<'google' | 'facebook' | null>(null);

  const [googleRequest, googleResponse, promptGoogle] = useGoogleAuthRequest();
  const [facebookRequest, facebookResponse, promptFacebook] = useFacebookAuthRequest();

  const afterLogin = (data: { accessToken: string; refreshToken: string; profiles: unknown[] }) => {
    saveToken(data.accessToken, data.refreshToken).then(() => {
      router.replace(data.profiles.length > 0 ? '/(tabs)' : '/profile/create');
    });
  };

  const loginWithGoogle = trpc.auth.loginWithGoogle.useMutation({
    onSuccess: afterLogin,
    onError: (e) => Alert.alert('Đăng nhập Google thất bại', e.message),
    onSettled: () => setPending(null),
  });

  const loginWithFacebook = trpc.auth.loginWithFacebook.useMutation({
    onSuccess: afterLogin,
    onError: (e) => Alert.alert('Đăng nhập Facebook thất bại', e.message),
    onSettled: () => setPending(null),
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params['id_token'];
      if (idToken) loginWithGoogle.mutate({ idToken });
      else setPending(null);
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss' || googleResponse?.type === 'cancel') {
      setPending(null);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      const accessToken = facebookResponse.params['access_token'];
      if (accessToken) loginWithFacebook.mutate({ accessToken });
      else setPending(null);
    } else if (facebookResponse?.type === 'error' || facebookResponse?.type === 'dismiss' || facebookResponse?.type === 'cancel') {
      setPending(null);
    }
  }, [facebookResponse]);

  const handleGoogle = () => {
    if (!isGoogleConfigured()) {
      Alert.alert('Chưa cấu hình', 'Đăng nhập Google chưa được thiết lập. Vui lòng thử số điện thoại.');
      return;
    }
    setPending('google');
    promptGoogle().catch(() => setPending(null));
  };

  const handleFacebook = () => {
    if (!isFacebookConfigured()) {
      Alert.alert('Chưa cấu hình', 'Đăng nhập Facebook chưa được thiết lập. Vui lòng thử số điện thoại.');
      return;
    }
    setPending('facebook');
    promptFacebook().catch(() => setPending(null));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top decorative gradient band */}
      <View style={styles.topBand} />

      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoKanji}>元気</Text>
          </View>
          <Text style={styles.appName}>Genki</Text>
          <Text style={styles.tagline}>Khoẻ mỗi ngày 🥗</Text>
          <Text style={styles.sub}>Theo dõi dinh dưỡng cho cả gia đình</Text>
        </View>

        {/* Login buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, styles.btnGoogle]}
            disabled={!googleRequest || pending !== null}
            onPress={handleGoogle}
          >
            <View style={styles.btnInner}>
              {pending === 'google' ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <Ionicons name="logo-google" size={20} color="#4285F4" />
              )}
              <Text style={styles.btnTextDark}>Tiếp tục với Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnFacebook]}
            disabled={!facebookRequest || pending !== null}
            onPress={handleFacebook}
          >
            <View style={styles.btnInner}>
              {pending === 'facebook' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="logo-facebook" size={20} color="#fff" />
              )}
              <Text style={styles.btnTextLight}>Tiếp tục với Facebook</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPhone]}
            onPress={() => router.push('/(auth)/phone-otp')}
          >
            <View style={styles.btnInner}>
              <Ionicons name="phone-portrait-outline" size={20} color="#2ECC71" />
              <Text style={styles.btnTextGreen}>Đăng nhập bằng Số điện thoại</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          Bằng việc tiếp tục, bạn đồng ý với{' '}
          <Text style={styles.link}>Điều khoản sử dụng</Text>
          {' '}và{' '}
          <Text style={styles.link}>Chính sách bảo mật</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBand: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
    backgroundColor: '#F0FDF4',
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  inner: {
    flex: 1, paddingHorizontal: 28,
    justifyContent: 'space-between', paddingBottom: Platform.OS === 'web' ? 32 : 16,
  },
  logoArea: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: '#2ECC71',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2ECC71', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  logoKanji: { fontSize: 38, color: '#fff', fontWeight: '700' },
  appName: { fontSize: 32, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: '#2ECC71', fontWeight: '600', marginTop: 4 },
  sub: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },

  buttons: { gap: 12 },
  btn: {
    paddingVertical: 15, paddingHorizontal: 20, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnGoogle: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  btnFacebook: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  btnPhone: { backgroundColor: '#F0FDF4', borderColor: '#2ECC71' },
  btnTextDark: { fontSize: 15, fontWeight: '600', color: '#111827' },
  btnTextLight: { fontSize: 15, fontWeight: '600', color: '#fff' },
  btnTextGreen: { fontSize: 15, fontWeight: '600', color: '#2ECC71' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F3F4F6' },
  dividerText: { fontSize: 13, color: '#9CA3AF' },

  terms: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 18 },
  link: { color: '#2ECC71', fontWeight: '500' },
});
