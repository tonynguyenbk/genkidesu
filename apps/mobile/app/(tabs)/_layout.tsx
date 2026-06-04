import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2ECC71',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : undefined,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: () => null }} />
      <Tabs.Screen name="camera" options={{ title: 'Chụp ảnh', tabBarIcon: () => null }} />
      <Tabs.Screen name="stats" options={{ title: 'Thống kê', tabBarIcon: () => null }} />
      <Tabs.Screen name="family" options={{ title: 'Gia đình', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarIcon: () => null }} />
    </Tabs>
  );
}
