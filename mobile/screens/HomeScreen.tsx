import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const PADDING = isSmallDevice ? 16 : 20;

const COLORS = {
  primary: '#003ec7',
  primaryContainer: '#0052ff',
  secondaryContainer: '#fe6b00',
  background: '#f8f9fa',
  surface: '#f8f9fa',
  surfaceContainer: '#edeeef',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerLowest: '#ffffff',
  onBackground: '#191c1d',
  onSurface: '#191c1d',
  onSurfaceVariant: '#434656',
  white: '#ffffff',
};

const CATEGORIES = [
  { id: '1', name: 'Laundry', icon: 'shirt-outline', color: COLORS.primary },
  { id: '2', name: 'Deep Clean', icon: 'sparkles', color: COLORS.primary },
  { id: '3', name: 'Fumigation', icon: 'bug-outline', color: COLORS.primary },
  { id: '4', name: 'Detailing', icon: 'car-sport-outline', color: COLORS.primary },
  { id: '5', name: 'Sofa', icon: 'bed-outline', color: COLORS.primary },
  { id: '6', name: 'Polytank', icon: 'water-outline', color: COLORS.primary },
  { id: '7', name: 'Worker', icon: 'construct-outline', color: COLORS.primary },
  { id: '8', name: 'More', icon: 'grid-outline', color: COLORS.primary },
];

const PROMOS = [
  {
    id: '1',
    tag: 'Limited Time',
    title: '20% Off Deep Cleaning',
    subtitle: 'Use code PRESTIGE20',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHRE-xEv3kJbPMCa8ly4II0BS8b4iG69odsPlx7pg_DB7cQxlGyAaaKaJ0npNB7Se4sqMs7gcBCVfhYoYW02ftiIjcBZb52Qttl0aULXwtv9ldEFV_I_Cm_adotVa4UmDxHdj37D1nh3t-usc45lCWdAcXiYftqaqmJcrdQ602ScrTbqXOz_X2mBKTlWtCFMQ-TQJrBp9yLltyJRSNCarfKe9cWhGK3n38OyZZCyb-IlBfU8-68biT',
    bg: COLORS.secondaryContainer,
  },
  {
    id: '2',
    tag: 'Bundle Deal',
    title: 'Interior + Exterior Pro',
    subtitle: 'Save ₵150 today',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjONPA9Z-5LyH54tBHNslkmCWhEO9GQ74vz38eszpki-Lia61l9rc8G91DIn9_PXFtiKKoBVERzZsAqtlMa4Hhu3sJAU2eIEX01X_7q55O_TqjkTRD45Vh7ScOgf1vAUCdPzc_TjzU7oWv4scUh1ZcD5STqycvmH6QRlSyKRcrOFSZPqgMD5mdJj_V4Sz0GMGiRSCeMq0hx5kosEQlzjYR0S3g2i4I3Bqvqzy4ywHpOuqLO6Rp7iYK',
    bg: COLORS.primaryContainer,
  },
];

export default function HomeScreen({ navigation }: any) {
    const renderCategory = ({ item }: any) => (
    <TouchableOpacity
      style={styles.categoryItem}
      activeOpacity={0.7}
      onPress={async () => {
        if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // 1. If it's Worker, go to Workers screen
        if (item.id === '7') {
          navigation.navigate('Workers');
        } 
        // 2. If it's "More", go to the All Services screen
        else if (item.id === '8') {
          navigation.navigate('Services');
        } 
        // 3. Otherwise, go to the specific Booking screen
        else {
          navigation.navigate('Booking', { serviceType: item.id });
        }
      }}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name={item.icon as any} size={28} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );
  const renderPromo = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.promoCard, { backgroundColor: item.bg }]} 
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.promoImage} />
      <View style={styles.promoOverlay} />
      <View style={styles.promoContent}>
        <Text style={styles.promoTag}>{item.tag}</Text>
        <Text style={styles.promoTitle}>{item.title}</Text>
        <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle} numberOfLines={1}>Home</Text>
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

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingSub}>Good morning,</Text>
            <Text style={styles.greetingName}>Kwame Boateng</Text>
          </View>
          <View style={styles.greetingRight}>
            <TouchableOpacity 
  style={styles.notificationBtn}
  onPress={() => navigation.navigate('Notifications')}
>
  <Ionicons name="notifications-outline" size={24} color={COLORS.onSurfaceVariant} />
  <View style={styles.notificationDot} />
</TouchableOpacity>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7IOBsM5GE2AL2QwMK-3S2jw3C5frnXy_Jck21oSxpal-CxlOydIL65nJbdxY_IM34E3iIDmbdOmAi82-9O63Si-ZSic2bK13BcntjAdvAniuOIAgteEGlD4pInN7i476IKbAaLXZCDV05eaizdXBmvHeqRx3We6vi9ZJWfsfOA_7cZYnry56fL0iOPcUYNUL0Iy8KczYcVg4OCQmXG2L9LiLj03lT0Cq_nfu8u2Ul38AbP_q8awEu' }}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="What service do you need today?"
            placeholderTextColor={COLORS.onSurfaceVariant}
          />
        </View>

        {/* Active Order Banner */}
        <View style={styles.activeOrderBanner}>
          <View style={styles.progressCircle}>
            <View style={styles.progressCircleBg} />
            <View style={styles.progressCircleFill} />
            <Text style={styles.progressText}>65%</Text>
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>ACTIVE SERVICE</Text>
            <Text style={styles.orderTitle}>Deep Clean</Text>
            <View style={styles.orderStatus}>
              <Ionicons name="car-sport" size={16} color={COLORS.white} />
              <Text style={styles.orderStatusText}>Crew en route</Text>
            </View>
          </View>
          {/* FIX: Added navigation to Tracking screen */}
          <TouchableOpacity 
            style={styles.trackButton} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Tracking')}
          >
            <Text style={styles.trackButtonText}>Track Live</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Services')}>
  <Text style={styles.viewAllText}>View All</Text>
</TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            numColumns={4}
            scrollEnabled={false}
            columnWrapperStyle={styles.categoryRow}
          />
        </View>

        {/* Promotions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
          </View>
          <FlatList
            data={PROMOS}
            renderItem={renderPromo}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promoList}
            snapToInterval={SCREEN_WIDTH * 0.85 + 16}
            decelerationRate="fast"
          />
        </View>

        {/* Delight Moment */}
        <View style={styles.delightCard}>
          <View style={styles.delightIcon}>
            <Ionicons name="star" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.delightTitle}>Experience Excellence</Text>
          <Text style={styles.delightSubtitle}>We're ready to make your space shine today.</Text>
          <TouchableOpacity 
            style={styles.bookButton} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Booking', { serviceType: '1' })}
          >
            <Text style={styles.bookButtonText}>Book a Service</Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Spacer for Nav */}
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerLogo: { width: 32, height: 32 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { padding: 8 },
  profileBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  greetingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PADDING, marginBottom: 20, marginTop: 8,
  },
  greetingSub: { fontSize: 14, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  greetingName: { fontSize: 24, fontWeight: '700', color: COLORS.onSurface },
  greetingRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute', top: 12, right: 12, width: 10, height: 10,
    borderRadius: 5, backgroundColor: COLORS.secondaryContainer, borderWidth: 2, borderColor: COLORS.background,
  },
  profileImage: { width: 48, height: 48, borderRadius: 24 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12, height: 56, paddingHorizontal: 16, marginHorizontal: PADDING, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.onSurface, fontWeight: '500' },
  activeOrderBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    borderRadius: 24, padding: 20, marginHorizontal: PADDING, marginBottom: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  progressCircle: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  progressCircleBg: {
    ...StyleSheet.absoluteFillObject, borderRadius: 32, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)',
  },
  progressCircleFill: {
    ...StyleSheet.absoluteFillObject, borderRadius: 32, borderWidth: 4, borderColor: COLORS.white,
    borderLeftColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '45deg' }],
  },
  progressText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  orderInfo: { flex: 1 },
  orderLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 4 },
  orderTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 8 },
  orderStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderStatusText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },
  trackButton: {
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  trackButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PADDING, marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  viewAllText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  categoryRow: { justifyContent: 'space-between', paddingHorizontal: PADDING },
  categoryItem: { alignItems: 'center', width: (SCREEN_WIDTH - (PADDING * 2) - 24) / 4 },
  categoryIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  categoryName: { fontSize: 12, fontWeight: '500', color: COLORS.onSurface, textAlign: 'center' },
  promoList: { paddingHorizontal: PADDING, gap: 16 },
  promoCard: {
    width: SCREEN_WIDTH * 0.85, height: 180, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  promoImage: { width: '100%', height: '100%' },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  promoContent: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  promoTag: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 4 },
  promoTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  promoSubtitle: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },
  delightCard: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 24, padding: 24, marginHorizontal: PADDING,
    alignItems: 'center',
  },
  delightIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  delightTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  delightSubtitle: { fontSize: 14, fontWeight: '400', color: COLORS.onSurfaceVariant, textAlign: 'center', marginBottom: 20 },
  bookButton: {
    width: '100%', height: 56, backgroundColor: COLORS.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  bookButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});