// mobile/app/onboarding/index.tsx
import { useState, useRef } from 'react';
import { 
  View, Text, Image, TouchableOpacity, Dimensions, 
  ScrollView, SafeAreaView, Animated, StyleSheet, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    id: 'laundry',
    title: 'Laundry & Garment Care',
    subtitle: 'Expert washing, ironing & doorstep delivery for your finest fabrics.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvos_nR1B3t8Hfn0C7dOqTMzjfnueyji0TLwJuTLn2vuYy2GkUDlPVvVc2H4EQnYe8ejPZm07htSro2Nuzs-d4e_kU2Iv1c_TQHnIXBQtJEQUlWuGifMNxtJhFN-q1crrNcqjJk0cm671rwbyjrCE-rvwHvWcnOiZ0LrMl1zTzxDQ_DpBOgsju0OjzuUNg4T7Hn83lAu8mjoNykiLBTQBhwpMfsG2YRuHo76o9BhgR609w1Bu_q-aG',
    accent: '#003ec7',
  },
  {
    id: 'cleaning',
    title: 'Deep Cleaning',
    subtitle: 'Homes, offices, churches & hospitals. Thorough & certified hygiene.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaOr_hoJdh_0GjW-YllrN_fHooN5w46et0W1BvF3j9zQ_8GpS_56iSxLj2PlI5P3HXbUyHJ-3WNqnIi4y5YxozidBPccL6YfoiOE2FRzlMEK2vLcbDy0znzT2gp8VkKtvGbsvfoD1imOyy_-D9-wOcqq8hVxc_ullTo0NzLWvsL2K_bs_Pb118Sl98iIWU2nT3bHyGWFLeA1kavhsKp4xfmwYC_g1vpMxlfaEciMl91qrBnA8xCnGp',
    accent: '#fe6b00',
  },
  {
    id: 'revival',
    title: 'Revival Services',
    subtitle: 'Premium car detailing and upholstery restoration that looks like new.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVmxpx-ezqAOyV6vPQ6shxglv_nv9akAoSsdHpH_NbC5g7nQ96VVSovCm-zkr0B5lvYvDA4Q1dv8rjttFx3h79hAVolQlRV-Ug73BJSofkzRMGZx2y7VlUVkXfAkZH0OZPhaPmWL2iwJPmw7Gdd5YrF7-r8G-JNlHJhOCTF-jy1LMfZ8Q6NKCM8nFPa7XhNc4-uVoNr_O4nCZ2eTkaMC2nuwBHxm1kxXLXlUmiIY-eRc7rIaPgA41O',
    accent: '#003ec7',
  },
  {
    id: 'polytank',
    title: 'Specialist Cleaning',
    subtitle: 'Safe, industrial-grade cleaning for all Polytank and water storage sizes.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN6Tit9JlGlcYHYo2fDyf9SrUiBUJsnOKA9ZOypSeksThSCKH-SGxBG4opLUxn3DMZt0AtSRV8rBV-_vSTE0oLF-9qi5iw9kfgs7ooiAXMkf_V_8VCzDg49Ou1UeTlv4bKbkftV2WxeYuJvnyNMDE_s6H5I69DDMgJUc_pVdOvyL7xuOdc65C6iyTqX5DSLStyzE2PHBhETAQIdtJdUk17sDsoEl-HemVn_KbOlfAc9itWZjIIJECi',
    accent: '#003ec7',
  },
  {
    id: 'marketplace',
    title: 'Worker Marketplace',
    subtitle: 'Electricians, plumbers, and installers on demand. Quality you can trust.',
    icon: true,
    accent: '#fe6b00',
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/auth/login');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.setValue(offsetX);
    const slideIndex = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentSlide(slideIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.imageContainer}>
              {slide.icon ? (
                <View style={styles.iconGrid}>
                  {['bolt', 'plumbing', 'build', 'cleaning_services'].map((icon, i) => (
                    <View 
                      key={icon} 
                      style={[
                        styles.iconBox,
                        i === 1 && styles.iconBoxOffset1,
                        i === 2 && styles.iconBoxOffset2,
                        i === 3 && styles.iconBoxOffset3,
                      ]}
                    >
                      <MaterialIcons 
                        name={icon as any} 
                        size={48} 
                        color={i % 2 === 0 ? '#003ec7' : '#fe6b00'} 
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.imageWrapper}>
                  <Animated.View 
                    style={[
                      styles.pulseBg,
                      { 
                        backgroundColor: `${slide.accent}15`,
                        transform: [{ scale: scrollX.interpolate({
                          inputRange: [index * SCREEN_WIDTH - 50, index * SCREEN_WIDTH, index * SCREEN_WIDTH + 50],
                          outputRange: [0.95, 1, 0.95],
                          extrapolate: 'clamp'
                        })}]
                      }
                    ]}
                  />
                  <Image
                    source={{ uri: slide.image }}
                    style={styles.slideImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { 
                    backgroundColor: isActive ? '#003ec7' : '#c3c5d9',
                    width: scrollX.interpolate({
                      inputRange: [
                        (index - 1) * SCREEN_WIDTH,
                        index * SCREEN_WIDTH,
                        (index + 1) * SCREEN_WIDTH
                      ],
                      outputRange: [8, isActive ? 32 : 8, 8],
                      extrapolate: 'clamp'
                    })
                  }
                ]}
              />
            );
          })}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handlePrev}
            disabled={currentSlide === 0}
            style={[styles.button, styles.backButton, currentSlide === 0 && styles.buttonHidden]}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.button, 
              styles.nextButton,
              { backgroundColor: currentSlide === slides.length - 1 ? '#fe6b00' : '#003ec7' }
            ]}
          >
            <Text style={styles.nextButtonText}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  slide: { width: SCREEN_WIDTH, paddingHorizontal: 20, alignItems: 'center' },
  imageContainer: { width: '100%', aspectRatio: 1, maxWidth: 320, marginTop: 24, alignItems: 'center', justifyContent: 'center' },
  imageWrapper: { width: '100%', height: '100%', position: 'relative' },
  pulseBg: { position: 'absolute', inset: 0, borderRadius: 9999 },
  slideImage: { width: '100%', height: '100%', position: 'relative', zIndex: 10 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: '100%', height: '100%', padding: 32 },
  iconBox: { backgroundColor: '#edeeef', borderRadius: 16, width: '45%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  iconBoxOffset1: { marginTop: 32 },
  iconBoxOffset2: { marginTop: -16 },
  iconBoxOffset3: { marginTop: 0 },
  textContainer: { marginTop: 32, alignItems: 'center', paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#191c1d', textAlign: 'center', lineHeight: 36 },
  subtitle: { marginTop: 8, fontSize: 16, color: '#434656', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8 },
  controls: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  button: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  backButton: { flex: 1 },
  buttonHidden: { opacity: 0 },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#737688' },
  nextButton: { flex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  nextButtonText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
});