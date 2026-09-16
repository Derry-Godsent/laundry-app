import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_SCREENS = 6;

const COLORS = {
  primary: '#003ec7',
  primaryContainer: '#0052ff',
  primaryFixed: '#dde1ff',
  secondaryContainer: '#fe6b00',
  background: '#0a0a1a',
  onBackground: '#ffffff',
  onSurfaceVariant: 'rgba(255,255,255,0.7)',
  white: '#ffffff',
};

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleGetStarted = async () => {
    if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace('Login');
  };

  const handleSkip = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.replace('Login');
  };

  const slides = [
    {
      icon: 'sparkles',
      title: 'Chapman Prestige',
      subtitle: 'Professional Care for Modern Living in Kumasi',
      description: 'Your trusted partner for premium home and facility services.',
      color: COLORS.primary,
    },
    {
      icon: 'shirt',
      title: 'Laundry & Garment Care',
      subtitle: 'Stop wasting weekends on laundry',
      description: 'From delicate silks to traditional Kente, we handle it all with expert care.',
      color: COLORS.primaryContainer,
    },
    {
      icon: 'sofa',
      title: 'Sofa & Carpet Revival',
      subtitle: 'Your furniture deserves professional revival',
      description: 'Deep-steam extraction restores color and texture to your finest fabrics.',
      color: COLORS.secondaryContainer,
    },
    {
      icon: 'bug',
      title: 'Certified Fumigation',
      subtitle: 'Protect your family from pests',
      description: 'Eco-friendly pest control that\'s tough on intruders but safe for your loved ones.',
      color: COLORS.primary,
    },
    {
      icon: 'car-sport',
      title: 'Premium Car Detailing',
      subtitle: 'Showroom shine, delivered to your driveway',
      description: 'Full interior restoration and ceramic exterior coating.',
      color: COLORS.primaryContainer,
    },
    {
      icon: 'checkmark-circle',
      title: 'Ready to Upgrade?',
      subtitle: 'Join hundreds of busy Kumasi residents',
      description: 'Who\'ve chosen convenience, quality, and peace of mind.',
      color: COLORS.secondaryContainer,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {currentIndex < NUM_SCREENS - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Main Scroll View */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.slideContent}>
              <View style={[styles.iconContainer, { backgroundColor: slide.color }]}>
                <Ionicons name={slide.icon as any} size={80} color={COLORS.white} />
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
              <Text style={styles.description}>{slide.description}</Text>
              
              {index === slides.length - 1 && (
                <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted} activeOpacity={0.8}>
                  <Text style={styles.ctaButtonText}>Get Started</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Progress Indicator */}
      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorTrack}>
          <View
            style={[
              styles.indicatorFill,
              {
                width: `${((currentIndex + 1) / NUM_SCREENS) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.indicatorText}>
          {currentIndex + 1} / {NUM_SCREENS}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 120,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onBackground,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondaryContainer,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  ctaButton: {
    marginTop: 32,
    paddingHorizontal: 48,
    paddingVertical: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  indicatorTrack: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  indicatorFill: {
    height: '100%',
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: 2,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
});