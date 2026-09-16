import React, { useState, useEffect, useRef } from 'react'; // Added useState here
import {
  View,
  Text,
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
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 20;

const COLORS = {
  primary: '#003ec7',
  primaryFixed: '#dde1ff',
  primaryContainer: '#0052ff',
  secondary: '#a04100',
  secondaryContainer: '#fe6b00',
  secondaryFixed: '#ffdbcc',
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

export default function ServicesScreen({ navigation }: any) {
  const fadeAnims = useRef(
    Array(7).fill(0).map(() => new Animated.Value(0))
  ).current;

  // 1. State for real services from database
  const [realServices, setRealServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setRealServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // 3. Staggered fade-in animation for cards
  useEffect(() => {
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleServicePress = async (serviceId: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (serviceId === '7') {
      navigation.navigate('Workers');
    } else {
      navigation.navigate('Booking', { serviceType: serviceId });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Services</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={24} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-circle" size={24} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Ambient Background Glows */}
        <View style={styles.ambientGlow1} />
        <View style={styles.ambientGlow2} />

        {/* Page Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Premium Care for Modern Living</Text>
          <Text style={styles.introSubtitle}>
            Experience world-class facility management and home services tailored for the Kumasi lifestyle. Professional, reliable, and just a tap away.
          </Text>
        </View>

        {/* DYNAMIC DATABASE SERVICES LIST (Proves connection works!) */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading services from database...</Text>
          </View>
        ) : (
          <View style={styles.dynamicServicesContainer}>
            <Text style={styles.dynamicTitle}>Live Database Services ({realServices.length})</Text>
            {realServices.map((service) => (
              <View key={service.id} style={styles.dynamicServiceItem}>
                <View style={styles.dynamicServiceInfo}>
                  <Text style={styles.dynamicServiceName}>{service.name}</Text>
                  <Text style={styles.dynamicServiceCategory}>{service.category}</Text>
                </View>
                <Text style={styles.dynamicServicePrice}>₵{service.price_wash || 0}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Services Grid (Your beautiful hardcoded UI) */}
        <View style={styles.servicesGrid}>
          {/* 1. Garment Care */}
          <Animated.View style={[styles.card, { opacity: fadeAnims[0] }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => handleServicePress('1')} activeOpacity={0.8}>
              <View style={styles.garmentHeader}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPWALwlF3OznJIDxSxvLkhZegdpYIer2YzIYO7z3Pzp7N6TyHH3oW3hkkggyuXNNdP90m4hoqigkXaH3XvivupmD58ppH9GVV7ZNxPgt_tZ_aubDACocbGUv7SRas0ptI0hFQCpw7V0L6FbTj7CZsimOqxZDFQxK8KpOrtbUMTIzaIAV_GqsP0MbXjrWSD82ds4z-MrJNKCPYRH0tuZtiMvLbCZqkdBGP9zxza61BDmga52TlfMTzo' }} style={styles.garmentImage} />
                <View style={styles.garmentInfo}>
                  <Text style={styles.cardTitle}>Garment Care</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    <Text style={styles.verifiedText}>Expert Handling</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.cardDescription}>Beyond washing, we provide meticulous garment therapy. From delicate silks to traditional heritage wear, our doorstep pickup and delivery ensure your style remains pristine without the effort.</Text>
              <TouchableOpacity style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Book Pickup</Text>
                <Ionicons name="car" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>

          {/* 2. Deep Sanitization */}
          <Animated.View style={[styles.card, { opacity: fadeAnims[1] }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => handleServicePress('2')} activeOpacity={0.8}>
              <View style={styles.deepCleanImageContainer}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrCvJTRWpPW54wpUVE5rdC7BwAGhs0abNTcXVQJ-m-BnGd-dzHgAWntjJG9RcZBwDo2_1Twth3nkjpeBPhzVpqvR5btn3r8JQ-uOl-O39jPTL4Yu1xI0hSffbohBE-FUdL5hOs5J8F8rABQsDRdVa4Ed7vly5wYKhhKZmxYcvHZt1aYVcqC3_eAs6dcyGdbU8r6Iwb01SaeIAXk7XcaQfihLzuK-KD7MCknQqZ-7Lw-oyKuwZlFTQR' }} style={styles.deepCleanImage} />
                <View style={styles.sanitizationBadge}>
                  <Text style={styles.sanitizationBadgeText}>Sanitization Pro</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Deep Sanitization</Text>
              <Text style={styles.cardDescription}>Hospitals, offices, and homes require more than a surface wipe. Our industrial-grade sanitization removes 99.9% of pathogens, creating a healthy haven for your family or workforce.</Text>
              <TouchableOpacity style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>View Checklist</Text>
                <Ionicons name="list" size={20} color={COLORS.onSurface} />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>

          {/* 3. Certified Fumigation */}
          <Animated.View style={[styles.card, { opacity: fadeAnims[2] }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => handleServicePress('3')} activeOpacity={0.8}>
              <View style={styles.fumigationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Certified Fumigation</Text>
                  <Text style={styles.cardDescription}>Eco-friendly pest control that's tough on intruders but safe for your pets and children. We offer certified quarterly protection plans for peace of mind.</Text>
                  <TouchableOpacity style={styles.linkBtn}>
                    <Text style={styles.linkBtnText}>Get a Quote</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.fumigationIconBox}>
                  <Ionicons name="bug" size={32} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* 4. Premium Detailing */}
          <Animated.View style={[styles.card, { opacity: fadeAnims[3] }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => handleServicePress('4')} activeOpacity={0.8}>
              <View style={styles.detailingHeader}>
                <View style={{ flex: 1, zIndex: 10 }}>
                  <Text style={styles.cardTitle}>Premium Detailing</Text>
                  <Text style={styles.cardDescription}>Full interior restoration and ceramic exterior coating. We bring the showroom shine directly to your driveway.</Text>
                </View>
                <Ionicons name="car-sport" size={120} color={COLORS.primary} style={{ opacity: 0.1, position: 'absolute', right: -16, top: 16 }} />
              </View>
              <View style={styles.detailingGrid}>
                <View style={styles.detailingBox}>
                  <Text style={styles.detailingBoxLabel}>Interior</Text>
                  <Text style={[styles.detailingBoxValue, { color: COLORS.primary }]}>Deep Clean</Text>
                </View>
                <View style={styles.detailingBox}>
                  <Text style={styles.detailingBoxLabel}>Exterior</Text>
                  <Text style={[styles.detailingBoxValue, { color: COLORS.secondaryContainer }]}>Wax & Buff</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Schedule Service</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>

          {/* 5. Fabric Revival */}
          <Animated.View style={[styles.card, { opacity: fadeAnims[4] }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => handleServicePress('5')} activeOpacity={0.8}>
              <View style={styles.fabricHeader}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7e9L2OULROepfwBk4L-LcW-xJLtVtpYls-CNPMRI1UenUPIpJFAf6ZW3rn8iSDtXP4J9JdqRF6TX1Fah6yKppxFEYhPbhzWoHW6pJXu41JNhxa9JP7aPTPT5iFQ9a0jrI1KP5Yb3zh3WbLeUz_JWXdwMyuL-dTodyu6kevxLKko-kTxk8T9QC0fQLt7ok4jQLhqKg3zkxA0dTrX8mlw7JgSER7i7gPlgP_UHEZzssVS4Bd1nDgSuR' }} style={styles.fabricImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Fabric Revival</Text>
                  <Text style={styles.fabricSubtitle}>Restore the original color and texture of your furniture with our deep-steam extraction technology.</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.outlineBtn}>
                <Text style={styles.outlineBtnText}>View Pricing</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>

          {/* 6. Water Safety (Polytank) */}
          <Animated.View style={[styles.card, styles.polytankCard, { opacity: fadeAnims[5] }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => handleServicePress('6')} activeOpacity={0.8}>
              <View style={{ position: 'relative', zIndex: 10 }}>
                <Text style={[styles.cardTitle, { color: COLORS.white }]}>Water Safety</Text>
                <Text style={[styles.cardDescription, { color: 'rgba(255,255,255,0.9)' }]}>Industrial-grade cleaning for water storage tanks. Ensure your household water is free from sediment and bacteria.</Text>
                <View style={styles.polytankFooter}>
                  <View style={styles.polytankIcons}>
                    <View style={styles.polytankIconCircle}>
                      <Ionicons name="water" size={16} color={COLORS.white} />
                    </View>
                    <View style={styles.polytankIconCircle}>
                      <Ionicons name="flask" size={16} color={COLORS.white} />
                    </View>
                  </View>
                  <Text style={styles.polytankBadge}>WHO Standards Compliant</Text>
                </View>
              </View>
              <View style={styles.polytankWave} />
            </TouchableOpacity>
          </Animated.View>

          {/* 7. Worker Marketplace */}
          <Animated.View style={[styles.card, styles.workerCard, { opacity: fadeAnims[6] }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => handleServicePress('7')} activeOpacity={0.8}>
              <View style={styles.workerHeader}>
                <Text style={styles.cardTitle}>Worker Marketplace</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>Live Now</Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>Instantly connect with vetted electricians, plumbers, and handymen. Our marketplace ensures fair pricing and guaranteed craftsmanship.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workerTags}>
                <View style={styles.workerTag}>
                  <Ionicons name="flash" size={18} color={COLORS.onSurfaceVariant} />
                  <Text style={styles.workerTagText}>Electricians</Text>
                </View>
                <View style={styles.workerTag}>
                  <Ionicons name="water" size={18} color={COLORS.onSurfaceVariant} />
                  <Text style={styles.workerTagText}>Plumbers</Text>
                </View>
                <View style={styles.workerTag}>
                  <Ionicons name="color-palette" size={18} color={COLORS.onSurfaceVariant} />
                  <Text style={styles.workerTagText}>Painters</Text>
                </View>
              </ScrollView>
              <TouchableOpacity style={styles.workerBtn}>
                <Text style={styles.workerBtnText}>Browse Specialists</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Support CTA */}
        <View style={styles.supportCard}>
          <View style={styles.supportIconBox}>
            <Ionicons name="headset" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.supportTitle}>Need a custom plan?</Text>
          <Text style={styles.supportSubtitle}>Our concierge team is available to tailor services for large estates and corporate headquarters.</Text>
          <TouchableOpacity style={styles.conciergeBtn}>
            <Text style={styles.conciergeBtnText}>Contact Concierge</Text>
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
    backgroundColor: 'rgba(248, 249, 250, 0.8)', borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainer,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.onSurface },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  
  scrollView: { flex: 1 },
  
  ambientGlow1: {
    position: 'absolute', top: -50, left: -50, width: SCREEN_WIDTH * 0.7, height: SCREEN_WIDTH * 0.4,
    backgroundColor: 'rgba(0, 62, 199, 0.05)', borderRadius: 999, opacity: 0.5,
  },
  ambientGlow2: {
    position: 'absolute', top: SCREEN_WIDTH * 0.4, right: -50, width: SCREEN_WIDTH * 0.6, height: SCREEN_WIDTH * 0.5,
    backgroundColor: 'rgba(254, 107, 0, 0.1)', borderRadius: 999, opacity: 0.5,
  },

  introCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', marginHorizontal: PADDING, marginTop: 20, marginBottom: 24,
    padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  introTitle: { fontSize: 28, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  introSubtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 24 },

  // Dynamic Database List Styles
  loadingContainer: { padding: 20, alignItems: 'center' },
  loadingText: { fontSize: 16, color: COLORS.onSurfaceVariant },
  dynamicServicesContainer: { marginHorizontal: PADDING, marginBottom: 24 },
  dynamicTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface, marginBottom: 12 },
  dynamicServiceItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest, padding: 16, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.surfaceContainerHigh
  },
  dynamicServiceInfo: { flex: 1 },
  dynamicServiceName: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  dynamicServiceCategory: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2, textTransform: 'capitalize' },
  dynamicServicePrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary },

  servicesGrid: { paddingHorizontal: PADDING, gap: 16 },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  cardContent: { gap: 16 },
  cardTitle: { fontSize: 24, fontWeight: '700', color: COLORS.onSurface },
  cardDescription: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 24 },

  // Garment Care
  garmentHeader: { flexDirection: 'row', gap: 16 },
  garmentImage: { width: 80, height: 80, borderRadius: 16 },
  garmentInfo: { flex: 1, justifyContent: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  verifiedText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // Deep Clean
  deepCleanImageContainer: { width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  deepCleanImage: { width: '100%', height: '100%' },
  sanitizationBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  sanitizationBadgeText: { fontSize: 12, fontWeight: '600', color: '#572000' },

  // Fumigation
  fumigationRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  fumigationIconBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16 },
  linkBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // Detailing
  detailingHeader: { position: 'relative', minHeight: 100 },
  detailingGrid: { flexDirection: 'row', gap: 12 },
  detailingBox: { flex: 1, backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 16 },
  detailingBoxLabel: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  detailingBoxValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },

  // Fabric
  fabricHeader: { flexDirection: 'row', gap: 16 },
  fabricImage: { width: 96, height: 96, borderRadius: 16 },
  fabricSubtitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 8 },

  // Polytank
  polytankCard: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.3 },
  polytankFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  polytankIcons: { flexDirection: 'row' },
  polytankIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginLeft: -8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  polytankBadge: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  polytankWave: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },

  // Worker Marketplace
  workerCard: { borderTopWidth: 4, borderTopColor: COLORS.secondaryContainer },
  workerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveBadge: { backgroundColor: COLORS.secondaryFixed, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  liveBadgeText: { fontSize: 12, fontWeight: '600', color: '#572000' },
  workerTags: { gap: 8, marginTop: 16 },
  workerTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surfaceContainer, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  workerTagText: { fontSize: 14, fontWeight: '500', color: COLORS.onSurface },
  workerBtn: { height: 44, backgroundColor: COLORS.secondaryContainer, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  workerBtnText: { fontSize: 14, fontWeight: '600', color: '#572000' },

  // Support Card
  supportCard: {
    backgroundColor: COLORS.surfaceContainerHigh, marginHorizontal: PADDING, marginTop: 24,
    padding: 24, borderRadius: 24, alignItems: 'center',
  },
  supportIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  supportTitle: { fontSize: 24, fontWeight: '700', color: COLORS.onSurface },
  supportSubtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  conciergeBtn: { paddingHorizontal: 24, height: 44, borderRadius: 22, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  conciergeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // Buttons
  primaryBtn: { height: 44, backgroundColor: COLORS.primary, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  secondaryBtn: { height: 44, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  outlineBtn: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
});