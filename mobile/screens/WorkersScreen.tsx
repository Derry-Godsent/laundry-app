import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const PADDING = isSmallDevice ? 16 : 20;

const COLORS = {
  primary: '#003ec7',
  primaryFixed: '#dde1ff',
  primaryFixedDim: '#b7c4ff',
  secondaryContainer: '#fe6b00',
  secondaryFixedDim: '#ffb693',
  background: '#f8f9fa',
  surface: '#f8f9fa',
  surfaceContainer: '#edeeef',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  surfaceBright: '#f8f9fa',
  onBackground: '#191c1d',
  onSurface: '#191c1d',
  onSurfaceVariant: '#434656',
  outline: '#737688',
  white: '#ffffff',
  error: '#ba1a1a',
  inverseSurface: '#2e3132',
  inverseOnSurface: '#f0f1f2',
};

const TRADES = ['All Trades', 'Electricians', 'Plumbers', 'Cleaners', 'Carpenters', 'Painters'];

const WORKERS = [
  {
    id: '1',
    name: 'Kofi Mensah',
    title: 'Master Electrician',
    rating: 4.9,
    price: 85,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtOcTkkcpBh8T8VElrloST_-AtzbETGZXW0DHD0qCT888Gw_-6MCgqNvUYJ2mnutY2C02bkYrPuZo5XMaz8BXDUyUy39ddPDXjFNSiER8q-7z7XtNpkLFvjKqQl3oCCZAveSDDk5vZR3zE9p3bDKW73XLOS1S0wiuhdiwsrAzMJOdljicadUUuhU5PGWn9SN9jDLPeuZpKBMDwH8xBTFsifGjjMAI4mhZoa1zGCRzvFR-S-K2e5v2p',
    availability: 'Available Now',
    isAvailableNow: true,
  },
  {
    id: '2',
    name: 'Ama Serwaa',
    title: 'Plumbing Specialist',
    rating: 4.8,
    price: 70,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQpPH3hQmSre8GNbOw64-paHjaJNTqfocHpNJUlYcKdN3f1X10stOvTUuB053BB08MzAgZy0Or2FERReqFsQJT-AliCtnXzMsLnMfcsh5jxVeoSYbd2Sc1YVEZ-cVMJW-dwKcF3K_LSn9h96eoOjKje-Hu-rImy4JFn0PCByr98UebNh9PIrHnl1aCtIwjJqqJ0nNsnX9L8RkegFU0iW2FQB5PT8qr23CmvfgushEMlUSK5orV7L0h',
    availability: 'Available in 2h',
    isAvailableNow: false,
  },
];

export default function WorkersScreen({ navigation }: any) {
  const [selectedTrade, setSelectedTrade] = useState('All Trades');
  const [requestingId, setRequestingId] = useState<string | null>(null);
  
  // Toast Animation
  const toastAnim = useRef(new Animated.Value(100)).current; // Start off-screen (bottom)

  const handleRequest = async (id: string) => {
    setRequestingId(id);
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setTimeout(() => {
      setRequestingId(null);
      showToast();
    }, 1200);
  };

  const showToast = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 4000);
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
          <Text style={styles.headerTitle} numberOfLines={1}>Workers</Text>
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search & Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.outline} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search skilled professionals..."
              placeholderTextColor={COLORS.outline}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
            {TRADES.map((trade) => (
              <TouchableOpacity
                key={trade}
                style={[styles.chip, selectedTrade === trade && styles.chipActive]}
                onPress={() => setSelectedTrade(trade)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedTrade === trade && styles.chipTextActive]}>
                  {trade}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sorting & Total Results */}
        <View style={styles.sortRow}>
          <Text style={styles.resultsText}>124 available today</Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Ionicons name="filter" size={18} color={COLORS.primary} />
            <Text style={styles.sortText}>Highest Rated</Text>
          </TouchableOpacity>
        </View>

        {/* Marketplace Grid */}
        <View style={styles.grid}>
          {WORKERS.map((worker) => (
            <View key={worker.id} style={styles.workerCard}>
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: worker.image }} style={styles.cardImage} />
                <View style={[styles.availabilityBadge, worker.isAvailableNow ? styles.badgeAvailable : styles.badgeLater]}>
                  {worker.isAvailableNow && <View style={styles.pulseDot} />}
                  <Text style={[styles.badgeText, worker.isAvailableNow ? styles.badgeTextAvailable : styles.badgeTextLater]}>
                    {worker.availability}
                  </Text>
                </View>
                <TouchableOpacity style={styles.favoriteBtn} activeOpacity={0.7}>
                  <Ionicons name="heart-outline" size={20} color={COLORS.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerTitle}>{worker.title}</Text>
                  </View>
                  <View style={styles.ratingBox}>
                    <Ionicons name="star" size={16} color={COLORS.secondaryContainer} />
                    <Text style={styles.ratingText}>{worker.rating}</Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.price}>₵{worker.price}</Text>
                    <Text style={styles.priceUnit}>/ hr</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.requestBtn, requestingId === worker.id && styles.requestBtnLoading]} 
                    onPress={() => handleRequest(worker.id)}
                    disabled={requestingId === worker.id}
                    activeOpacity={0.8}
                  >
                    {requestingId === worker.id ? (
                      <View style={styles.spinner} />
                    ) : (
                      <>
                        <Text style={styles.requestBtnText}>Request</Text>
                        <Ionicons name="flash" size={18} color={COLORS.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Empty State / Delight Moment */}
          <View style={styles.delightSection}>
            <View style={styles.delightIconContainer}>
              <View style={styles.delightPulse} />
              <View style={styles.delightIcon}>
                <Ionicons name="construct" size={40} color={COLORS.primary} />
              </View>
            </View>
            <Text style={styles.delightTitle}>Need a Specialist?</Text>
            <Text style={styles.delightSubtitle}>We have 12 more specialists matching your criteria just around the corner.</Text>
            <TouchableOpacity style={styles.showMoreBtn}>
              <Text style={styles.showMoreText}>Show more results</Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>


      {/* Success Toast */}
      <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}>
        <View style={styles.toastContent}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.secondaryFixedDim} />
          <Text style={styles.toastText}>Request sent to professional!</Text>
        </View>
        <TouchableOpacity onPress={() => {
          Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start();
        }}>
          <Text style={styles.toastDismiss}>DISMISS</Text>
        </TouchableOpacity>
      </Animated.View>
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
  scrollContent: { paddingBottom: 100 }, // Space for bottom nav
  
  searchSection: { paddingHorizontal: PADDING, paddingVertical: 12, gap: 12 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12, height: 52, paddingHorizontal: 16,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.onSurface, fontWeight: '500' },
  chipContainer: { gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surfaceContainer },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  chipTextActive: { color: COLORS.white },

  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PADDING, marginBottom: 16 },
  resultsText: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  grid: { paddingHorizontal: PADDING, gap: 16 },
  workerCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardImageContainer: { height: 192, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  availabilityBadge: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(248, 249, 250, 0.9)' },
  badgeAvailable: { backgroundColor: 'rgba(248, 249, 250, 0.9)' },
  badgeLater: { backgroundColor: 'rgba(248, 249, 250, 0.9)' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondaryContainer },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextAvailable: { color: COLORS.secondaryContainer },
  badgeTextLater: { color: COLORS.onSurfaceVariant },
  favoriteBtn: { position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(248, 249, 250, 0.9)', alignItems: 'center', justifyContent: 'center' },
  
  cardContent: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  workerName: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  workerTitle: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(254, 107, 0, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 14, fontWeight: '600', color: '#572000' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  price: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  priceUnit: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  requestBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 20, height: 44, borderRadius: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  requestBtnLoading: { opacity: 0.8 },
  requestBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  spinner: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: COLORS.white },

  delightSection: { paddingVertical: 48, alignItems: 'center', gap: 16 },
  delightIconContainer: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  delightPulse: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(0, 62, 199, 0.1)' },
  delightIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  delightTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  delightSubtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 32 },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  showMoreText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  toast: {
    position: 'absolute', bottom: 100, left: PADDING, right: PADDING,
    backgroundColor: COLORS.inverseSurface, borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  toastContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toastText: { fontSize: 14, fontWeight: '600', color: COLORS.inverseOnSurface },
  toastDismiss: { fontSize: 12, fontWeight: '600', color: COLORS.primaryFixedDim, letterSpacing: 1 },
});