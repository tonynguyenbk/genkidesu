import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, ActivityIndicator, Platform, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

// Parses Vietnamese-style decimal input ("7,5" → 7.5); null when empty/invalid.
function parseNum(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default function ContributeFoodScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  // Prefill the name when opened from a wrong scan result
  const { name: presetName } = useLocalSearchParams<{ name?: string }>();

  const [nameVi, setNameVi] = useState(presetName ?? '');
  const [servingG, setServingG] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [sugarG, setSugarG] = useState('');
  const [sodiumMg, setSodiumMg] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
    else Alert.alert(title, msg);
  };

  const contribute = trpc.food.contribute.useMutation({
    onSuccess: (data) => {
      notify(
        'Genki đã học món này!',
        data.learned
          ? `"${data.nameVi}" đã được lưu. Lần quét sau sẽ nhận diện đúng thông số bạn cung cấp.`
          : `"${data.nameVi}" đã được lưu và sẽ được kích hoạt nhận diện sau.`,
      );
      router.back();
    },
    onError: (e) => notify('Lỗi', e.message),
  });

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (Platform.OS === 'web' && asset.base64) {
      setImageDataUrl(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
      return;
    }
    const actions = asset.width && asset.width > 1024 ? [{ resize: { width: 1024 } }] : [];
    const resized = await ImageManipulator.manipulateAsync(asset.uri, actions, {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    setImageDataUrl(`data:image/jpeg;base64,${resized.base64}`);
  }, []);

  const handleSubmit = () => {
    const serving = parseNum(servingG);
    const kcal = parseNum(calories);
    const protein = parseNum(proteinG);
    const carbs = parseNum(carbsG);
    const fat = parseNum(fatG);
    if (nameVi.trim().length < 2 || serving == null || kcal == null || protein == null || carbs == null || fat == null) {
      notify('Thiếu thông tin', 'Hãy điền tên món, khẩu phần và 4 giá trị dinh dưỡng bắt buộc (kcal, đạm, tinh bột, béo).');
      return;
    }
    contribute.mutate({
      nameVi: nameVi.trim(),
      servingG: serving,
      calories: kcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      sugarG: parseNum(sugarG) ?? undefined,
      sodiumMg: parseNum(sodiumMg) ?? undefined,
      imageDataUrl: imageDataUrl ?? undefined,
    });
  };

  const field = (
    label: string, value: string, onChange: (v: string) => void,
    placeholder: string, required = false,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType="decimal-pad"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Dạy Genki món mới</Text>
        <Text style={styles.subtitle}>
          Nhập thông tin từ bảng "Giá trị dinh dưỡng" trên bao bì. Genki sẽ ghi nhớ và nhận diện đúng cho bạn và mọi người từ lần sau.
        </Text>

        <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
          {imageDataUrl ? (
            <Image source={{ uri: imageDataUrl }} style={styles.photo} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={theme.colors.textTertiary} />
              <Text style={styles.photoHint}>Thêm ảnh sản phẩm (không bắt buộc)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={styles.label}>Tên món / sản phẩm *</Text>
          <TextInput
            style={styles.input}
            value={nameVi}
            onChangeText={setNameVi}
            placeholder="VD: Đậu phộng rang vị nước cốt dừa Oishi Pinattsu"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {field('Khẩu phần trên nhãn (g)', servingG, setServingG, 'VD: 30', true)}

        <Text style={styles.sectionTitle}>Giá trị dinh dưỡng cho 1 khẩu phần</Text>
        <View style={styles.row}>
          <View style={styles.half}>{field('Năng lượng (kcal)', calories, setCalories, 'VD: 140', true)}</View>
          <View style={styles.half}>{field('Chất đạm (g)', proteinG, setProteinG, 'VD: 5', true)}</View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>{field('Carbohydrat (g)', carbsG, setCarbsG, 'VD: 15', true)}</View>
          <View style={styles.half}>{field('Chất béo (g)', fatG, setFatG, 'VD: 7', true)}</View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>{field('Đường (g)', sugarG, setSugarG, 'VD: 6')}</View>
          <View style={styles.half}>{field('Natri (mg)', sodiumMg, setSodiumMg, 'VD: 45')}</View>
        </View>

        <TouchableOpacity
          style={[styles.btn, contribute.isPending && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={contribute.isPending}
        >
          {contribute.isPending
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="school-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Dạy Genki món này</Text>
              </View>
            )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    back: { padding: 16 },
    backText: { color: theme.colors.primary, fontSize: 16 },
    content: { padding: 24, paddingTop: 0, gap: 12 },
    title: { fontSize: 26, fontWeight: '700', color: theme.colors.text },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginTop: 8 },
    photoBox: {
      height: 120, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
      borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
      alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden',
    },
    photo: { width: '100%', height: '100%' },
    photoHint: { fontSize: 13, color: theme.colors.textTertiary },
    field: { gap: 6 },
    label: { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary },
    input: {
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      padding: 14, fontSize: 16, backgroundColor: theme.colors.surface, color: theme.colors.text,
    },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
    btn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
