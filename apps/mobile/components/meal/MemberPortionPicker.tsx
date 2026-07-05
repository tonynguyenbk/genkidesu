import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

const STEP = 0.25;
const MIN = 0.25;
const MAX = 3;

// One member row in the Meal Sync sheet: checkbox + name + portion stepper.
// Portion control (− / +) only shows once the member is ticked.
export function MemberPortionPicker({
  name, type, selected, ratio, kcalBase, conflict, onToggle, onRatioChange,
}: {
  name: string;
  type: string;
  selected: boolean;
  ratio: number;
  kcalBase: number;
  conflict?: boolean;
  onToggle: () => void;
  onRatioChange: (ratio: number) => void;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isChild = type === 'baby' || type === 'teen';

  return (
    <View style={[styles.row, selected && styles.rowActive]}>
      <TouchableOpacity style={styles.left} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.check, selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
          {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}{isChild && <Text style={styles.childTag}>  Trẻ em</Text>}</Text>
          {conflict
            ? <Text style={styles.conflict}>Đã ghi bữa gần đây</Text>
            : selected && <Text style={styles.kcal}>+{Math.round(kcalBase * ratio)} kcal</Text>}
        </View>
      </TouchableOpacity>

      {selected && (
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onRatioChange(Math.max(MIN, parseFloat((ratio - STEP).toFixed(2))))}
          >
            <Ionicons name="remove" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.ratio}>{Math.round(ratio * 100)}%</Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onRatioChange(Math.min(MAX, parseFloat((ratio + STEP).toFixed(2))))}
          >
            <Ionicons name="add" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8,
      backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.border,
    },
    rowActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
    left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    check: {
      width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: theme.colors.border,
      justifyContent: 'center', alignItems: 'center',
    },
    name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    childTag: { fontSize: 11, fontWeight: '500', color: theme.colors.secondary },
    kcal: { fontSize: 12, color: theme.colors.primary, fontWeight: '600', marginTop: 1 },
    conflict: { fontSize: 12, color: theme.colors.warning, marginTop: 1 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepBtn: {
      width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: theme.colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    ratio: { fontSize: 14, fontWeight: '700', color: theme.colors.text, minWidth: 42, textAlign: 'center' },
  });
}
