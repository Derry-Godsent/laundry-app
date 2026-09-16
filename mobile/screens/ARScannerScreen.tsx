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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  primary: '#003ec7',
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
  white: '#ffffff',
  error: '#ba1a1a',
};

export default function ARScannerScreen({ route, navigation }: any) {
  const { serviceType } = route.params || {}
  const [area, setArea] = useState(24.5);
  const [height, setHeight] = useState(2.8);
  const [progress, setProgress] = useState(84);
  const [isFlashing, setIsFlashing] = useState(false);

  // Animations
  const scanBeamY = useRef(new Animated.Value(-20)).current;
  const shutterPulse = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Animate the scanning beam moving down the screen
    Animated.loop(
      Animated.timing(scanBeamY, {
        toValue: SCREEN_HEIGHT,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // 2. Animate the shutter pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(shutterPulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shutterPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // 3. Simulate live data updates (Area jitter & Progress increment)
    const scanInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        setArea((prev) => parseFloat((prev + (Math.random() * 0.4 - 0.2)).toFixed(1)));
      }
      setProgress((prev) => (prev < 100 ? Math.min(100, prev + Math.floor(Math.random() * 2)) : 100));
    }, 800);

    return () => clearInterval(scanInterval);
  }, []);

  const handleShutterPress = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Trigger flash animation
    setIsFlashing(true);
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setIsFlashing(false);
    // Navigate to Checkout with a mock AR-scanned service
    // Send the scanned area back to the Booking screen
       // Send the scanned area AND the service type back to the Booking screen
   navigation.navigate('Booking', { serviceType: serviceType, scannedArea: 24.5 });  
    });
  };

  return (
    <View style={styles.container}>
      {/* 1. Simulated Camera Feed Background */}
      <Image
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIMeWYxfKptdSahUkE7SuYN-aSpL5sP5SbS51t93JDBxVCv4whk_Zd8DWqdc-7z4QcPXUjHdpgml9bkPC3Qezauk5qtNt8XMXH6GfuXggQKmFFyrTF8k3IdXLWCh2Kzzz8_uJXIAk_Mjr_ar_DxlR4ZFUmQXGL7xbZp8vUDIqS_FqP2Ip3wB0xCokVRKCw5FAhrjIq3zSf95tGIOjMTNWZpc9ZCTaDeqfAGFqvcrgMhC3t9F-HaAhm' }}
        style={styles.cameraBackground}
        resizeMode="cover"
      />

      {/* 2. AR Grid & Scanning Beam Overlay */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {/* Simulated Grid Pattern using borders */}
        <View style={styles.gridPattern} />
        
        {/* Animated Scanning Beam */}
        <Animated.View 
          style={[
            styles.scanBeam, 
            { transform: [{ translateY: scanBeamY }] }
          ]} 
        />
      </View>

      {/* 3. Header (Transparent/Glassmorphic) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>AR Scanner</Text>
        </View>
        <View style={styles.profileBadge}>
          <Ionicons name="person" size={18} color={COLORS.white} />
        </View>
      </View>

      {/* 4. Top Status Overlay */}
      <View style={styles.topOverlay}>
        <View style={styles.statusRow}>
          <View style={styles.scanningBadge}>
            <View style={styles.pulsingDot} />
            <Text style={styles.scanningText}>Scanning...</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="flash" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Live Data Readouts */}
        <View style={styles.dataGrid}>
          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Est. Area</Text>
            <View style={styles.dataValueRow}>
              <Text style={styles.dataValue}>{area.toFixed(1)}</Text>
              <Text style={styles.dataUnit}>m²</Text>
            </View>
          </View>
          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Height</Text>
            <View style={styles.dataValueRow}>
              <Text style={styles.dataValue}>{height.toFixed(1)}</Text>
              <Text style={styles.dataUnit}>m</Text>
            </View>
          </View>
        </View>

        {/* Surface Detection Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Detecting Surfaces</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* 5. Bottom Interactive Section */}
      <View style={styles.bottomOverlay}>
        {/* Floating Price Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.priceCardsContainer}>
          <View style={[styles.priceCard, { borderBottomColor: COLORS.secondaryContainer }]}>
            <View style={styles.priceCardHeader}>
              <Ionicons name="water" size={18} color={COLORS.secondaryContainer} />
              <Text style={[styles.priceCardTag, { color: COLORS.secondaryContainer }]}>Deep Clean</Text>
            </View>
            <Text style={styles.priceCardAmount}>GH₵ 450</Text>
            <Text style={styles.priceCardSub}>Premium Grade</Text>
          </View>
          
          <View style={[styles.priceCard, { borderBottomColor: COLORS.primary }]}>
            <View style={styles.priceCardHeader}>
              <Ionicons name="bug" size={18} color={COLORS.primary} />
              <Text style={[styles.priceCardTag, { color: COLORS.primary }]}>Fumigation</Text>
            </View>
            <Text style={styles.priceCardAmount}>GH₵ 320</Text>
            <Text style={styles.priceCardSub}>Full Perimeter</Text>
          </View>
        </ScrollView>

        {/* Main Shutter Button */}
        <View style={styles.shutterContainer}>
          <Text style={styles.shutterHint}>
            Align corners for maximum accuracy. Confirm once dimensions settle.
          </Text>
          <TouchableOpacity 
            style={styles.shutterWrapper} 
            activeOpacity={0.8}
            onPress={handleShutterPress}
          >
            <Animated.View style={[styles.shutterOuter, { transform: [{ scale: shutterPulse }] }]}>
              <View style={styles.shutterInner}>
                <View style={styles.shutterCore}>
                  <Ionicons name="checkmark" size={28} color={COLORS.white} />
                </View>
              </View>
            </Animated.View>
            {/* Pulse Effect Ring */}
            <Animated.View style={[styles.shutterPulseRing, { transform: [{ scale: shutterPulse }], opacity: shutterPulse.interpolate({ inputRange: [1, 1.1], outputRange: [0.5, 0] }) }]} />
          </TouchableOpacity>
          <Text style={styles.shutterLabel}>Confirm Scan</Text>
        </View>
      </View>

      {/* 6. White Flash Overlay */}
      {isFlashing && (
        <Animated.View style={[styles.flashOverlay, { opacity: flashOpacity }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cameraBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4 },
  gridPattern: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: COLORS.primary, 
    // Simulating a grid with a repeating background would require an image, 
    // so we use a subtle transparent overlay with a border for the "AR" feel
    backgroundColor: 'rgba(0, 62, 199, 0.05)',
  },
  scanBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primaryContainer,
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16,
  },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(248, 249, 250, 0.8)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  profileBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  topOverlay: { position: 'absolute', top: 110, left: 20, right: 20, gap: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scanningBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(248, 249, 250, 0.8)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  scanningText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, textTransform: 'uppercase', letterSpacing: 1 },

  dataGrid: { flexDirection: 'row', gap: 12 },
  dataCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 12, padding: 12 },
  dataLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  dataValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  dataValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  dataUnit: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant, marginLeft: 4 },

  progressCard: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 12, padding: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  progressValue: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  progressBarBg: { width: '100%', height: 6, backgroundColor: COLORS.surfaceContainer, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },

  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 40 },
  priceCardsContainer: { gap: 12, marginBottom: 24 },
  priceCard: { width: 192, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 16, padding: 16, borderBottomWidth: 4 },
  priceCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  priceCardTag: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  priceCardAmount: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  priceCardSub: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 4 },

  shutterContainer: { alignItems: 'center', gap: 16 },
  shutterHint: { fontSize: 14, fontWeight: '500', color: COLORS.white, textAlign: 'center', maxWidth: 240, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  shutterWrapper: { alignItems: 'center', justifyContent: 'center' },
  shutterOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.white, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20 },
  shutterCore: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  shutterPulseRing: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  shutterLabel: { fontSize: 14, fontWeight: '600', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.white, zIndex: 100 },
});