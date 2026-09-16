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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const PADDING = isSmallDevice ? 16 : 20;

const COLORS = {
  primary: '#003ec7',
  primaryFixed: '#dde1ff',
  primaryFixedDim: '#b7c4ff',
  primaryContainer: '#0052ff',
  secondary: '#a04100',
  secondaryContainer: '#fe6b00',
  background: '#f8f9fa',
  surface: '#f8f9fa',
  surfaceContainer: '#edeeef',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#e7e8e9',
  onBackground: '#191c1d',
  onSurface: '#191c1d',
  onSurfaceVariant: '#434656',
  outline: '#737688',
  outlineVariant: '#c3c5d9',
  white: '#ffffff',
};

export default function BookingsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const handleTabPress = async (tab: 'active' | 'history') => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
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
          <Text style={styles.headerTitle} numberOfLines={1}>Bookings</Text>
        </View>
        <View style={styles.headerRight}>
             <TouchableOpacity 
     style={styles.iconButton}
     onPress={() => navigation.navigate('Notifications')}
   >
     <Ionicons name="notifications-outline" size={24} color={COLORS.onSurfaceVariant} />
   </TouchableOpacity>
          <View style={styles.profileBadge}>
            <Ionicons name="person" size={18} color={COLORS.white} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Elite Patronage Loyalty Card */}
        <View style={styles.loyaltyCard}>
          <LinearGradient
            colors={['#0038b6', '#0052ff', '#001452']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loyaltyGradient}
          />
          <View style={styles.loyaltyContent}>
            <View style={styles.loyaltyHeader}>
              <View style={styles.loyaltyText}>
                <Text style={styles.loyaltyStatus}>Status: Distinguished</Text>
                <Text style={styles.loyaltyTitle}>Elite Patronage</Text>
                <Text style={styles.loyaltySubtitle}>Welcome back, Kwame</Text>
              </View>
              <View style={styles.loyaltyIconBox}>
                {/* Simulated circular progress with border */}
                <View style={styles.progressCircleOuter}>
                  <View style={styles.progressCircleInner} />
                </View>
                <Ionicons name="diamond" size={32} color={COLORS.white} style={styles.loyaltyIcon} />
              </View>
            </View>
            
            <View style={styles.loyaltyFooter}>
              <View style={styles.loyaltyProgressContainer}>
                <Text style={styles.loyaltyProgressLabel}>Next Reward Milestone</Text>
                <View style={styles.progressBarBg}>
                  <View style={styles.progressBarFill} />
                </View>
              </View>
              <View style={styles.loyaltyDiscount}>
                <Text style={styles.loyaltyDiscountValue}>15%</Text>
                <Text style={styles.loyaltyDiscountLabel}>Discount</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'active' && styles.tabActive]} 
            onPress={() => handleTabPress('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.tabActive]} 
            onPress={() => handleTabPress('history')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Active Bookings List */}
        {activeTab === 'active' && (
          <View style={styles.listContainer}>
            <View style={styles.bookingCard}>
              <View style={styles.bookingLeftBorder} />
              <View style={styles.bookingHeader}>
                <View>
                  <Text style={styles.bookingTitle}>Deep Cleaning</Text>
                  <View style={styles.bookingTime}>
                    <Ionicons name="time-outline" size={16} color={COLORS.onSurfaceVariant} />
                    <Text style={styles.bookingTimeText}>Today, 2:00 PM</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>En Route</Text>
                </View>
              </View>
              
              <View style={styles.providerInfo}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_YrWzgsllaVHpVlV8iFh_fargUxmuiLrhMthuKUWCf1HmelMcaVkVr9JMzxtryBW91eZqYRCzpXJD3PEk69_VYV2TYsq8qa2-I5YiMPLJsnyuC9jBZsrVBZOHp75UtNFtfYbdZrG0PlIJh1IuAPcXkBZNhBZz_R6M2DsXDMRkMSwOQDUbLUgHAfySVU3DjfJNOmn5wT1r9Q3P42WnOXvm6blErrgXNi-D_fLPvXfhPG7Jj0g1F3Bn' }}
                  style={styles.providerImage}
                />
                <View style={styles.providerDetails}>
                  <Text style={styles.providerName}>Ama Mensah</Text>
                  <Text style={styles.providerTitle}>Premium Pro</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              </View>

              <TouchableOpacity 
                style={styles.trackBtn}
                onPress={() => navigation.navigate('Tracking')}
                activeOpacity={0.8}
              >
                <Ionicons name="location" size={20} color={COLORS.white} />
                <Text style={styles.trackBtnText}>Track Live</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* History Bookings List */}
        {activeTab === 'history' && (
          <View style={styles.listContainer}>
            <Text style={styles.historySectionTitle}>Past Month</Text>
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyTitle}>Standard Clean</Text>
                  <Text style={styles.historyDate}>Oct 12, 2023</Text>
                </View>
                <Text style={styles.historyPrice}>GHS 150</Text>
              </View>
              <TouchableOpacity style={styles.rebookBtn} activeOpacity={0.8}>
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
                <Text style={styles.rebookBtnText}>Rebook</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'bookings', icon: 'calendar', label: 'Bookings' },
          { id: 'workers', icon: 'construct-outline', label: 'Workers' },
          { id: 'chat', icon: 'chatbubble-outline', label: 'Chat' },
          { id: 'profile', icon: 'person-outline', label: 'Profile' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => {
              if (tab.id !== 'bookings') {
                navigation.navigate(tab.id === 'home' ? 'Home' : tab.id);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={tab.id === 'bookings' ? COLORS.primary : COLORS.onSurfaceVariant}
            />
            <Text style={[styles.navLabel, tab.id === 'bookings' && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PADDING, paddingTop: 50, paddingBottom: 16,
    backgroundColor: 'rgba(248, 249, 250, 0.8)', borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainer,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerLogo: { width: 32, height: 32 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { padding: 8 },
  profileBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  
  scrollView: { flex: 1 },
  
  loyaltyCard: {
    marginHorizontal: PADDING, marginTop: 16, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  loyaltyGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loyaltyContent: { padding: 20, position: 'relative', zIndex: 10 },
  loyaltyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loyaltyText: { flex: 1 },
  loyaltyStatus: { fontSize: 12, fontWeight: '600', color: COLORS.primaryFixed, letterSpacing: 1, textTransform: 'uppercase' },
  loyaltyTitle: { fontSize: 28, fontWeight: '700', color: COLORS.white, marginTop: 4 },
  loyaltySubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  loyaltyIconBox: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  progressCircleOuter: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  progressCircleInner: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: COLORS.primaryFixedDim, borderLeftColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '-45deg' }] },
  loyaltyIcon: { zIndex: 10, textShadowColor: 'rgba(255,255,255,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
  
  loyaltyFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  loyaltyProgressContainer: { flex: 1 },
  loyaltyProgressLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { width: '50%', height: '100%', backgroundColor: COLORS.primaryFixedDim, borderRadius: 3, shadowColor: COLORS.primaryFixedDim, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15 },
  loyaltyDiscount: { alignItems: 'flex-end' },
  loyaltyDiscountValue: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  loyaltyDiscountLabel: { fontSize: 12, fontWeight: '500', color: COLORS.white },

  tabContainer: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 999,
    padding: 4, marginHorizontal: PADDING, marginTop: 24, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(195, 197, 217, 0.2)',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  tabTextActive: { color: COLORS.white },

  listContainer: { paddingHorizontal: PADDING, gap: 16 },
  historySectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, marginBottom: 8 },

  bookingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
    borderWidth: 1, borderColor: 'rgba(25, 28, 29, 0.05)', position: 'relative', overflow: 'hidden',
  },
  bookingLeftBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: COLORS.secondary },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 8 },
  bookingTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface, letterSpacing: -0.5 },
  bookingTime: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  bookingTimeText: { fontSize: 16, color: COLORS.onSurfaceVariant },
  statusBadge: { backgroundColor: 'rgba(160, 65, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(160, 65, 0, 0.2)' },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, letterSpacing: -0.5, textTransform: 'uppercase' },
  
  providerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, paddingLeft: 8, backgroundColor: 'rgba(237, 238, 239, 0.3)', padding: 12, borderRadius: 12 },
  providerImage: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(25, 28, 29, 0.1)' },
  providerDetails: { flex: 1 },
  providerName: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  providerTitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, opacity: 0.7, marginTop: 2 },
  
  trackBtn: {
    marginTop: 16, height: 48, backgroundColor: COLORS.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 4,
  },
  trackBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  historyCard: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  historyDate: { fontSize: 16, color: COLORS.onSurfaceVariant, marginTop: 4 },
  historyPrice: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  rebookBtn: {
    marginTop: 16, height: 44, backgroundColor: 'rgba(0, 62, 199, 0.1)', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  rebookBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'rgba(248, 249, 250, 0.4)',
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 20,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navLabel: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  navLabelActive: { color: COLORS.primary, fontWeight: '600' },
});