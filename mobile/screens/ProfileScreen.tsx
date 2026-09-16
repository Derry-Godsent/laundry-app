import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const PADDING = isSmallDevice ? 16 : 20;

const COLORS = {
  primary: '#003ec7',
  primaryFixed: '#dde1ff',
  background: '#f8f9fa',
  surface: '#f8f9fa',
  surfaceContainer: '#edeeef',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  onBackground: '#191c1d',
  onSurface: '#191c1d',
  onSurfaceVariant: '#434656',
  outline: '#737688',
  white: '#ffffff',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  secondary: '#a04100',
};

interface ListItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  rightText?: string;
  isDestructive?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const ListItem: React.FC<ListItemProps> = ({ icon, title, subtitle, rightText, isDestructive, onPress, rightElement }) => {
  const textColor = isDestructive ? COLORS.error : COLORS.onSurface;
  const iconColor = isDestructive ? COLORS.error : COLORS.onSurfaceVariant;

  return (
    <TouchableOpacity 
      style={styles.listItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={24} color={iconColor} />
      <View style={styles.listItemContent}>
        <Text style={[styles.listItemTitle, { color: textColor }]}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      {rightElement || <Ionicons name="chevron-forward" size={20} color={isDestructive ? 'rgba(186, 26, 26, 0.3)' : COLORS.outline} />}
    </TouchableOpacity>
  );
};

export default function ProfileScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleTabPress = async (tab: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'bookings') navigation.navigate('Bookings');
    if (tab === 'workers') navigation.navigate('Workers');
    if (tab === 'chat') navigation.navigate('Chat');
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoggingOut(true);
    
    setTimeout(() => {
      setIsLoggingOut(false);
      Alert.alert('Logged Out', 'Successfully logged out.');
      // In a real app, you would clear auth state and navigate to Login/Onboarding
      // navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDolCkLrbtEMfue_L5daYQPY3OJINLp8pXTYLMTSnifWvhjGcOegRWTXgz8txA2-h5lb6-8e8iPvRhud2y5hwQ6lTdsJ-pMpBsYDMB-pJi7-Y_G2fcvoh2vrlIO-bgypxbqTAGWPpZiJAou9FZ3JvyEbvgO-oIqe-Yf4-3c69h31hqpXmxmi7KL2kKhBVIWOWsx3vYCqjCH0hb9vG7KFuoKKkQdfX8cTI-LjwMwGLxIBS4emHvc9Xpg' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle} numberOfLines={1}>Profile</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={22} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.profileBadge}>
            <Ionicons name="person" size={18} color={COLORS.white} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACot20wW3ITEeq1LwDjJMoRjBO9tp4Z4Lx-ULONqPheXlg0GXnmuH1fPJjk4QrPyBkWlpLQSrQVmvv4wDXobOZ9oC1mjr2pBvmY4-5KNfTYbhC--zrmMMt12BQR5-9XG0dscQDA4xk2RAch-kwU1b0TUIIp8_ej5R38nEOAkDUFUQfSP2AZciDxPcHxFPCjXWYhgwX2pKQr9aPt5taFB7tMcCxbbcVQ7-WNChcvd-9kwDo3WKsPxoE' }}
              style={styles.avatarImage}
            />
            <TouchableOpacity style={styles.editBadge} activeOpacity={0.8}>
              <Ionicons name="pencil" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Kwame Mensah</Text>
            <Text style={styles.userEmail}>kwame.m@prestige.gh</Text>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.card}>
            <ListItem icon="person-outline" title="Edit Profile" onPress={() => {}} />
            <View style={styles.divider} />
            <ListItem icon="location-outline" title="Saved Addresses" onPress={() => {}} />
            <View style={styles.divider} />
            <ListItem icon="card-outline" title="Payment Methods" onPress={() => {}} />
            <View style={styles.divider} />
            <ListItem 
  icon="notifications-outline" 
  title="Notifications" 
  onPress={() => navigation.navigate('Notifications')} 
/>
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.card}>
            <View style={styles.listItem}>
              <Ionicons name="moon-outline" size={24} color={COLORS.onSurfaceVariant} />
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
            <View style={styles.divider} />
            <ListItem icon="language-outline" title="Language" rightText="English" onPress={() => {}} />
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <ListItem 
              icon="phone-portrait-outline" 
              title="Active Sessions" 
              subtitle="2 devices active" 
              onPress={() => {}} 
            />
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <View style={styles.card}>
            <ListItem icon="help-circle-outline" title="FAQ" onPress={() => {}} />
            <View style={styles.divider} />
            <ListItem icon="headset-outline" title="Contact Us" onPress={() => {}} />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.card}>
            <ListItem 
              icon="trash-outline" 
              title="Delete Account" 
              isDestructive 
              onPress={() => Alert.alert('Delete Account', 'Are you sure you want to delete your account? This action cannot be undone.')} 
            />
          </View>
          <Text style={styles.versionText}>Chapman Prestige v2.4.1 • Made in Kumasi</Text>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={handleLogout}
            disabled={isLoggingOut}
            activeOpacity={0.8}
          >
            {isLoggingOut ? (
              <Ionicons name="refresh" size={20} color={COLORS.onSurface} style={{ transform: [{ rotate: '360deg' }] }} /> // Simplified spinner
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.logoutText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PADDING, paddingTop: 50, paddingBottom: 16,
    backgroundColor: 'rgba(248, 249, 250, 0.9)', borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainer,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerLogo: { width: 32, height: 32 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { padding: 8 },
  profileBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  
  scrollView: { flex: 1 },
  
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    marginHorizontal: PADDING, marginTop: 16, marginBottom: 24,
    padding: 16, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  editBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.surfaceContainerLowest,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  userEmail: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: COLORS.primary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, marginHorizontal: PADDING,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    marginHorizontal: PADDING, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16, minHeight: 56,
  },
  listItemContent: { flex: 1, marginLeft: 16 },
  listItemTitle: { fontSize: 16, fontWeight: '500' },
  listItemSubtitle: { fontSize: 12, fontWeight: '500', color: COLORS.secondary, marginTop: 2 },
  rightText: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant, marginRight: 8 },
  divider: { height: 1, backgroundColor: COLORS.surfaceContainer, marginHorizontal: 16 },

  versionText: {
    fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant,
    textAlign: 'center', marginTop: 16, marginHorizontal: PADDING,
  },
  logoutContainer: { paddingHorizontal: PADDING, paddingBottom: 20 },
  logoutBtn: {
    height: 56, backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },

});