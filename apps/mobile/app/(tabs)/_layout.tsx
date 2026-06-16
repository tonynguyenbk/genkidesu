import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IoniconName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
  // Hide tab bar on wide web (sidebar handles nav), show on mobile web (<768px)
  const hideTabBar = Platform.OS === 'web' && width >= 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        headerShown: false,
        tabBarStyle: hideTabBar
          ? { display: 'none' }
          : {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.divider,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 4,
            },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Chụp ảnh',
          tabBarIcon: ({ color, size }) => (
            <View style={[styles.cameraBtn, { backgroundColor: color === theme.colors.textTertiary ? theme.colors.border : theme.colors.primary }]}>
              <Ionicons name="camera" size={size - 2} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color, size }) => <TabIcon name="bar-chart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Gia đình',
          tabBarIcon: ({ color, size }) => <TabIcon name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <TabIcon name="person-circle" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});
