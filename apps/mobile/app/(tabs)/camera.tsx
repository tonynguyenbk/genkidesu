import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Platform, ActivityIndicator, ScrollView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: { id: MealType; label: string; icon: string; time: string }[] = [
  { id: 'breakfast', label: 'Bữa sáng', icon: '🌅', time: '6:00 – 10:00' },
  { id: 'lunch',     label: 'Bữa trưa', icon: '☀️',  time: '11:00 – 14:00' },
  { id: 'dinner',    label: 'Bữa tối',  icon: '🌙',  time: '17:00 – 21:00' },
  { id: 'snack',     label: 'Snack',    icon: '🍎',  time: 'Bất kỳ lúc nào' },
];

function getDefaultMealType(): MealType {
  const h = new Date().getHours();
  if (h >= 6 && h < 10)  return 'breakfast';
  if (h >= 11 && h < 14) return 'lunch';
  if (h >= 17 && h < 21) return 'dinner';
  return 'snack';
}

export default function CameraScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [scanning, setScanning] = useState(false);

  const profiles = trpc.profile.list.useQuery(undefined, { retry: false });
  const scan = trpc.meal.scan.useMutation();

  const pickImage = useCallback(async (fromCamera: boolean) => {
    if (Platform.OS === 'web' || !fromCamera) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền', 'Hãy cho phép Genki truy cập camera');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: true,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    }
  }, []);

  const handleScan = useCallback(async () => {
    if (!imageUri) return;
    const profileId = profiles.data?.[0]?.id;
    if (!profileId) {
      Alert.alert('Cần đăng nhập', 'Hãy tạo hồ sơ trước khi ghi nhận bữa ăn');
      return;
    }

    setScanning(true);
    try {
      const result = await scan.mutateAsync({
        imageDataUrl: imageUri,
        profileId,
        mealType,
      });
      router.push({
        pathname: '/meal/result',
        params: {
          scanData: JSON.stringify(result),
          profileId,
          mealType,
          imageUri,
        },
      });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể phân tích ảnh. Thử lại sau.');
    } finally {
      setScanning(false);
    }
  }, [imageUri, profiles.data, mealType, scan, router]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ghi nhận bữa ăn</Text>
          <Text style={styles.sub}>Chụp ảnh để AI phân tích dinh dưỡng</Text>
        </View>

        {/* Meal type selector */}
        <View style={styles.mealTypeRow}>
          {MEAL_TYPES.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.mealTypeBtn, mealType === m.id && styles.mealTypeBtnActive]}
              onPress={() => setMealType(m.id)}
            >
              <Text style={styles.mealTypeIcon}>{m.icon}</Text>
              <Text style={[styles.mealTypeLabel, mealType === m.id && styles.mealTypeLabelActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image area */}
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity style={styles.changeBtn} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadArea}>
            <View style={styles.uploadIcon}>
              <Ionicons name="camera" size={48} color="#2ECC71" />
            </View>
            <Text style={styles.uploadTitle}>Chụp ảnh bữa ăn</Text>
            <Text style={styles.uploadSub}>AI sẽ nhận diện món ăn và tính dinh dưỡng tự động</Text>

            <View style={styles.uploadButtons}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(true)}>
                  <Ionicons name="camera-outline" size={22} color="#2ECC71" />
                  <Text style={styles.uploadBtnText}>Mở camera</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.uploadBtn, Platform.OS === 'web' && styles.uploadBtnFull]}
                onPress={() => pickImage(false)}
              >
                <Ionicons name="image-outline" size={22} color="#2ECC71" />
                <Text style={styles.uploadBtnText}>
                  {Platform.OS === 'web' ? 'Chọn ảnh từ máy tính' : 'Chọn từ thư viện'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scan button */}
        {imageUri && (
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnLoading]}
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <View style={styles.scanBtnInner}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.scanBtnText}>AI đang phân tích...</Text>
              </View>
            ) : (
              <View style={styles.scanBtnInner}>
                <Ionicons name="scan" size={22} color="#fff" />
                <Text style={styles.scanBtnText}>Phân tích bữa ăn</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Tips */}
        {!imageUri && (
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>💡 Mẹo chụp ảnh</Text>
            {[
              'Chụp từ phía trên, đủ sáng',
              'Đảm bảo thấy toàn bộ món ăn trong khung hình',
              'Tránh bị che khuất bởi tay hoặc vật khác',
            ].map((tip, i) => (
              <Text key={i} style={styles.tipItem}>• {tip}</Text>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  header: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 8, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  mealTypeRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  mealTypeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  mealTypeBtnActive: { borderColor: '#2ECC71', backgroundColor: '#F0FDF4' },
  mealTypeIcon: { fontSize: 18, marginBottom: 2 },
  mealTypeLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  mealTypeLabelActive: { color: '#2ECC71' },

  uploadArea: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16,
    padding: 32, alignItems: 'center',
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  uploadIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  uploadSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  uploadButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#2ECC71',
    backgroundColor: '#F0FDF4',
  },
  uploadBtnFull: { flex: 1 },
  uploadBtnText: { fontSize: 13, fontWeight: '600', color: '#2ECC71' },

  imageContainer: { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 260 },
  changeBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14,
  },

  scanBtn: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#2ECC71',
    padding: 17, borderRadius: 16,
    shadowColor: '#2ECC71', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  scanBtnLoading: { backgroundColor: '#6EE7A0' },
  scanBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  scanBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  tips: {
    margin: 16, backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  tipItem: { fontSize: 13, color: '#B45309', lineHeight: 22 },
});
