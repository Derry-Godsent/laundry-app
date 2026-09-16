import React, { useState, useEffect, useRef } from 'react';
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
  surfaceContainerLow: '#f3f4f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  onBackground: '#191c1d',
  onSurface: '#191c1d',
  onSurfaceVariant: '#434656',
  outline: '#737688',
  white: '#ffffff',
};

export default function TrackingScreen({ navigation }: any) {
  const [eta, setEta] = useState(12);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Micro-interaction: Mimic live ETA updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setEta((prev) => Math.max(1, prev - 1));
        
        // Subtle pulse animation on update
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }
    }, 5000);

    // Continuous pulse for the "En Route" dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDolCkLrbtEMfue_L5daYQPY3OJINLp8pXTYLMTSnifWvhjGcOegRWTXgz8txA2-h5lb6-8e8iPvRhud2y5hwQ6lTdsJ-pMpBsYDMB-pJi7-Y_G2fcvoh2vrlIO-bgypxbqTAGWPpZiJAou9FZ3JvyEbvgO-oIqe-Yf4-3c69h31hqpXmxmi7KL2kKhBVIWOWsx3vYCqjCH0hb9vG7KFuoKKkQdfX8cTI-LjwMwGLxIBS4emHvc9Xpg' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle} numberOfLines={1}>Booking Detail</Text>
        </View>
        <View style={styles.profileBadge}>
          <Ionicons name="person" size={18} color={COLORS.white} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={{ color: COLORS.outline, fontWeight: '600', fontSize: 16 }}>Map View Placeholder</Text>
          </View>
          
          {/* Floating Info Overlay */}
          <View style={styles.etaOverlay}>
            <View style={styles.etaContent}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Animated.Text style={[styles.etaValue, { transform: [{ scale: pulseAnim }] }]}>
                {eta} mins
              </Animated.Text>
            </View>
            <View style={styles.etaIconBox}>
              <Ionicons name="car-sport" size={24} color={COLORS.white} />
            </View>
          </View>

          {/* Crew Card Snippet */}
          <View style={styles.crewCard}>
            <View style={styles.crewInfo}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpJM2Nc_puBWM-7_SAj-CO4Uhd9Oi7wLxrKR6Q0MVfFfoficnEFr9tyMlUO-hy0At6RUMKUT-CeSa2YfHWERY3Yo34jVV13o6IkgSNVswtdr430EDGQIU236Y2f-_ssoc0W8_tQZ4LYPzpbuc0tFM00caD7ctCa9RCStPQXYhOMGuSs4oSXFYpmk9UTsTREDwwC_AaD8D_laZr9bmkpGi-Q5A6q-UaAxrCH_wSv7i8mdFm3RNReppV' }}
                style={styles.crewImage}
              />
              <View style={styles.crewText}>
                <Text style={styles.crewName} numberOfLines={1}>Kofi Mensah</Text>
                <Text style={styles.crewTitle} numberOfLines={1}>Lead Technician</Text>
              </View>
            </View>
            <View style={styles.crewActions}>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Ionicons name="call" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Ionicons name="chatbubble" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {/* Status Timeline Card */}
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTitle}>Service Status</Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            </View>
            
            <View style={styles.timeline}>
              <View style={styles.timelineLine}>
                <View style={styles.timelineLineFill} />
              </View>
              
              {/* Step 1: Confirmed */}
              <View style={styles.timelineStep}>
                <View style={[styles.stepDot, styles.stepDotActive]}>
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Confirmed</Text>
                  <Text style={styles.stepSubtitle}>Order #CP-9921 received</Text>
                </View>
              </View>

              {/* Step 2: Crew Assigned */}
              <View style={styles.timelineStep}>
                <View style={[styles.stepDot, styles.stepDotActive]}>
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Crew Assigned</Text>
                  <Text style={styles.stepSubtitle}>Team Alpha dispatched</Text>
                </View>
              </View>

              {/* Step 3: En Route */}
              <View style={styles.timelineStep}>
                <Animated.View style={[styles.stepDot, styles.stepDotCurrent, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: COLORS.primary }]}>En Route</Text>
                  <Text style={styles.stepSubtitle}>Expected at 10:15 AM</Text>
                </View>
              </View>

              {/* Step 4: On Site */}
              <View style={[styles.timelineStep, styles.stepFuture]}>
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>On Site</Text>
                  <Text style={styles.stepSubtitle}>Awaiting arrival</Text>
                </View>
              </View>

              {/* Step 5: Completed */}
              <View style={[styles.timelineStep, styles.stepFuture]}>
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Completed</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Live Feed Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.feedCard}>
              <View style={styles.feedItem}>
                <View style={styles.feedIconBox}>
                  <Ionicons name="location" size={18} color={COLORS.white} />
                </View>
                <View style={styles.feedContent}>
                  <Text style={styles.feedTitle}>Arrived at location</Text>
                  <Text style={styles.feedSubtitle}>10:02 AM • 2.4km from destination</Text>
                </View>
              </View>
              <View style={[styles.feedItem, { opacity: 0.6 }]}>
                <View style={[styles.feedIconBox, { backgroundColor: COLORS.surfaceContainerHighest }]}>
                  <Ionicons name="flash" size={18} color={COLORS.onSurfaceVariant} />
                </View>
                <View style={styles.feedContent}>
                  <Text style={styles.feedTitle}>Service started</Text>
                  <Text style={styles.feedSubtitle}>Pending arrival</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Interaction Grid */}
          <View style={styles.interactionGrid}>
            <TouchableOpacity style={styles.gridBtn} activeOpacity={0.7} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.gridBtnText}>Upload Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridBtn} activeOpacity={0.7} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={styles.gridBtnText}>Special Instructions</Text>
            </TouchableOpacity>
          </View>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.completeBtn} 
              activeOpacity={0.8} 
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                alert('Task marked as complete!');
              }}
            >
              <Text style={styles.completeBtnText}>Mark Task Complete</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
                      <TouchableOpacity 
            style={styles.payBtn} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Checkout')}
          >
            <Text style={styles.payBtnText}>Pay Remaining Balance (₵2,450.00)</Text>
          </TouchableOpacity>
          </View>
          
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: PADDING, paddingTop: 50, paddingBottom: 16, 
    backgroundColor: 'rgba(248, 249, 250, 0.9)', borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainer 
  },
  backBtn: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12 },
  headerLogo: { width: 24, height: 24 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  profileBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  
  mapContainer: { width: '100%', height: 353, position: 'relative' },
  mapPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  etaOverlay: { 
    position: 'absolute', top: 16, left: PADDING, right: PADDING, 
    backgroundColor: 'rgba(248, 249, 250, 0.9)', borderRadius: 12, padding: 12, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },
  etaContent: { flexDirection: 'column' },
  etaLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  etaValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  etaIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  
  crewCard: {
    position: 'absolute', bottom: 16, left: PADDING, 
    backgroundColor: COLORS.surface, borderRadius: 999, padding: 4, paddingRight: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    maxWidth: '80%'
  },
  crewInfo: { flexDirection: 'row', alignItems: 'center' },
  crewImage: { width: 40, height: 40, borderRadius: 20 },
  crewText: { marginLeft: 8 },
  crewName: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  crewTitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  crewActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  contentArea: { marginTop: -24, zIndex: 10, paddingHorizontal: PADDING },
  timelineCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  timelineTitle: { fontSize: 24, fontWeight: '700', color: COLORS.onSurface },
  liveBadge: { backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  liveBadgeText: { fontSize: 14, fontWeight: '600', color: '#572000' },
  
  timeline: { position: 'relative', paddingLeft: 32, gap: 24 },
  timelineLine: { position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, backgroundColor: COLORS.surfaceContainerHighest },
  timelineLineFill: { width: '100%', height: '60%', backgroundColor: COLORS.primary },
  
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  stepFuture: { opacity: 0.4 },
  stepDot: { position: 'absolute', left: -32, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: COLORS.surfaceContainerLowest },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepDotCurrent: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  stepDotInactive: { backgroundColor: COLORS.surfaceContainerHighest },
  stepContent: { flex: 1, marginTop: -2 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  stepSubtitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 2 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  feedCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 12, gap: 8 },
  feedItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 12, padding: 12, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  feedIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  feedContent: { flex: 1 },
  feedTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  feedSubtitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 2 },

  interactionGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  gridBtn: { flex: 1, height: 100, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  gridBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },

  footer: { marginTop: 16, paddingBottom: 20 },
  completeBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  completeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  payBtn: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  payBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});