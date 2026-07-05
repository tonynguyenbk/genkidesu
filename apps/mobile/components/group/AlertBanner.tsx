import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { useThemedStyles } from '../../contexts/ThemeContext';
import { STATUS_COLORS, flagLabel, type MemberStatus } from '../../lib/groupStatus';

// One warning/danger row per member who needs attention.
export function AlertBanner({ name, status, alertFlags }: {
  name: string;
  status: MemberStatus;
  alertFlags: string[];
}) {
  const styles = useThemedStyles(createStyles);
  const color = STATUS_COLORS[status];
  const msg = alertFlags.map(flagLabel).join(' · ');
  return (
    <View style={[styles.banner, { backgroundColor: color + '18', borderColor: color + '55' }]}>
      <Ionicons name={status === 'danger' ? 'warning' : 'alert-circle'} size={18} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color }]}>{name}</Text>
        <Text style={styles.msg}>{msg}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1,
    },
    name: { fontSize: 16, fontWeight: '700' },
    msg: { fontSize: 13.5, color: theme.colors.textSecondary, marginTop: 1 },
  });
}
