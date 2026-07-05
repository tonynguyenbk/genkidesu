import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IoniconName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

// iOS: real UITabBar via NativeTabs — picks up Liquid Glass automatically on
// iOS 26/27 devices, SF Symbols, system behaviors (no JS re-implementation).
function IOSNativeTabsLayout() {
  const { theme } = useAppTheme();
  return (
    <NativeTabs tintColor={theme.colors.primary}>
      <NativeTabs.Trigger name="index">
        <Label>Trang chủ</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <Label>Thống kê</Label>
        <Icon sf="chart.bar.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="camera">
        <Label>Chụp ảnh</Label>
        <Icon sf={{ default: 'camera', selected: 'camera.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="group">
        <Label>Nhóm</Label>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Hồ sơ</Label>
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
      </NativeTabs.Trigger>
      {/* Group management routes stay reachable but off the tab bar */}
      <NativeTabs.Trigger name="family" hidden />
    </NativeTabs>
  );
}

// Android + web: JS tab bar (web hides it on wide screens — sidebar handles nav)
function JsTabsLayout() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
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
              borderTopWidth: StyleSheet.hairlineWidth,
              height: 60,
              paddingBottom: 8,
              paddingTop: 4,
            },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
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
        name="stats"
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color, size }) => <TabIcon name="bar-chart" color={color} size={size} />,
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
        name="group"
        options={{
          title: 'Nhóm',
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
      {/* Group management (create/join/invite/privacy) — reachable from the
          Nhóm tab's settings icon, hidden from the tab bar itself. */}
      <Tabs.Screen name="family" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return Platform.OS === 'ios' ? <IOSNativeTabsLayout /> : <JsTabsLayout />;
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
