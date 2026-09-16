import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  TextInput,
} from 'react-native';
   import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const PADDING = isSmallDevice ? 16 : 20;

const COLORS = {
  primary: '#003ec7',
  primaryFixed: '#dde1ff',
  primaryFixedDim: '#b7c4ff',
  primaryContainer: '#0052ff',
  secondaryContainer: '#fe6b00',
  secondaryFixedDim: '#ffb693',
  tertiaryContainer: '#676666',
  onTertiaryContainer: '#e7e4e4',
  onPrimaryFixed: '#001452',
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
  outlineVariant: '#c3c5d9',
  white: '#ffffff',
  green: '#16a34a',
};

// --- DYNAMIC SERVICE DATA CONFIGURATION ---
const SERVICE_DATA: any = {
  '1': { // Laundry
    type: 'items',
    title: "Premium Laundry",
    subtitle: "Professional washing, folding, and precision ironing for your finest garments.",
    icon: "shirt-outline",
    items: [
      { id: 'shirt', name: 'Shirt / Blouse', price: 5, icon: 'shirt-outline' },
      { id: 'suit', name: 'Full Suit', price: 50, icon: 'briefcase-outline' },
      { id: 'bedding', name: 'Bedding Set', price: 35, icon: 'bed-outline' },
    ]
  },
  '2': { // Deep Cleaning
    type: 'slider',
    title: "Deep Cleaning",
    subtitle: "Thorough sanitization for homes and offices.",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHC3h-t52xsAvE_SmXvvfnOg6bvYg-e2qGz2n30omnOz9b6flKx4OwlNMwWNJZTvZnMBKaGH9JDl1SDi5XHXqWC4wRDrjK6FumtvNxmHusGnef7aCWEpG_GMNmw6g1FGgI2U9kNpsRBO5B7ORmpNqAPw86bhBKMoqEa7I87mJ6HI16d2Z-_H4yys1pxee7Mc47SC2bEe5Ujjf6Dz-l6roFhqkaafumKvQzJISGIfqE58qtx3qQBJDo",
    badge: "Premium Care",
    infoTitle: "Site Assessment",
    infoSubtitle: "Recommended for 3+ units",
    basePrice: 450,
    multipliers: [1, 1.8, 2.5, 3.2, 4.0, 5.5],
    labels: ["1 BR", "2 BR", "3 BR", "4 BR", "5 BR", "6+ BR"],
    isQuoteRequest: true,
    priceRange: { min: 450, max: 1400 },
    pricingUnit: 'per_job',
  },
  '3': { // Fumigation
    type: 'fumigation',
    title: "Professional Fumigation",
    subtitle: "Certified pest control for residential and commercial spaces.",
    icon: "bug-outline",
    badge: "EPA Certified Professionals",
    services: [
      { id: 'cockroach', name: 'Cockroach', icon: 'bug-outline', basePrice: 300 },
      { id: 'bedbug', name: 'Bedbug', icon: 'bug', basePrice: 450 },
      { id: 'general', name: 'General', icon: 'sparkles', basePrice: 600 }
    ],
    sizeLabels: ['Studio/1 BR', '2-3 BR', '4 BR', 'Full Commercial'],
    sizeMultipliers: [1.0, 1.5, 2.0, 2.5],
    isQuoteRequest: true,
    priceRange: { min: 250, max: 3000 },
    pricingUnit: 'per_job',
  },

  '4': { // Car Detailing
    type: 'detailing',
    title: "Car Detailing",
    subtitle: "Premium restoration: interior cleaning, engine bay wash, and exterior wax.",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2mTky98vFkYrCIFMFBns967rlwLgVOkbke4F2pmNZgIOjJm0x8gaV5vmhS9Rl9pHkD3UrDbsQhy64AbTLO1AwHGGIZ-sZTtzZyOy55fpZIZJ2OW5q20ZWIKpLbEGaO4HvC594EY9MdARSRPpLrYNTXrvXZkaOgniE0qAm9AyjiF5i6dELGX46ZKbrpx92C43WxtWZyxiLc6WpBG8iYOd_eNFBpHI2FbpKeTEIgRLvGJJkOd-7yViK",
    badge: "PREMIUM CARE",
    vehicles: [
      { id: 'sedan', name: 'Sedan', icon: 'car-sport-outline' },
      { id: 'suv', name: 'SUV', icon: 'bus-outline' },
      { id: 'truck', name: 'Truck', icon: 'truck-outline' }
    ],
    packages: [
      { id: 'basic', name: 'Basic Wash', desc: '45 mins • Exterior Only', price: 45, icon: 'water-outline', color: COLORS.secondaryContainer, textColor: '#572000' },
      { id: 'full', name: 'Full Detail', desc: '3 hrs • Int & Ext Restoration', price: 180, icon: 'sparkles', color: COLORS.primaryContainer, textColor: COLORS.white, popular: true },
      { id: 'ceramic', name: 'Ceramic Coating', desc: '6 hrs • 2-Year Protection', price: 450, icon: 'diamond-outline', color: '#474646', textColor: COLORS.white }
    ],
      isQuoteRequest: true,
    priceRange: { min: 45, max: 550 },
    pricingUnit: 'per_job',
  },

  '5': { // Sofa & Carpet Revival
    type: 'sofa',
    title: "Sofa & Carpet Revival",
    subtitle: "Professional deep cleaning and premium restoration for your finest fabrics.",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkxXSnBO8Uk8cktcw3-fM1GoiunZimwEQAKzP2Ah-acUbh_tDzX1JdwHuUsimuF-DlJ9RHgi8meHlA1ziA5bNTgO6T0XZlyftajsdBZmAn1gRKHJeYMvJ2zFJE6NpqWgu1jKHRxZ4kMFDureav0WYiifCnFQJvBI208AaKC0vz8hvrMuH57Z3XhGvIRp-XOjZFFb1QT2kfOETKosFziR6-zdlUQBB1bNqV5mOII54azn4Q-Anji_n1",
    badge: "Premium Restoration",
  sofaItems: [
  { id: 'armchair', name: 'Armchair', price: 80, icon: 'chair-rolling' },
  { id: '3seater', name: '3-Seater Sofa', price: 220, icon: 'sofa' }
],

    carpetItems: [
      { id: 'medium_rug', name: 'Medium Rug', price: 15, unit: 'm²', icon: 'grid-outline' },
      { id: 'wall_to_wall', name: 'Wall-to-Wall', price: 12, unit: 'm²', icon: 'layers-outline' }
    ],
    enhancements: [
      { id: 'stain_removal', name: 'Stain Removal', desc: 'Intensive treatment', icon: 'water-outline' },
      { id: 'eco_friendly', name: 'Eco-Friendly Chemicals', desc: 'Kid & pet safe', icon: 'leaf-outline' }
    ],
      isQuoteRequest: true,
    priceRange: { min: 60, max: 350 },
    pricingUnit: 'per_job',
  },

  '6': { // Polytank Sanitization
    type: 'polytank',
    title: "Polytank Sanitization",
    subtitle: "Professional deep cleaning using food-grade disinfectants. We remove sludge, algae, and bio-films to ensure your household water remains safe and crystal clear.",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnLAFZCxWq8L466D9vXRAg67ppVNkxMxwoyKVFZrKoyhrY1St5m4NxdklqFZMoeMEnpCvBizbNBav5gpYFwPP6MUMiCDEeryIDUWTknm8BzP4Mmn8dve3vSEHk42jR0XiIrjy1-khZpoIATs_ClD9aNhU3Nf4wyNV3PC0i6VoDmOnAqZbTtk5ZhBv8KnfduLls24afyQ1aMRqrC7kH6_184fyJuuSGyLBA5bDK5sVkG7dg8TIJpf_a",
    badge: "Price Negotiable",
    startPrice: 150,
    sizes: [
      { id: 'small', name: 'Small', capacity: '200L-500L', icon: 'water' },
      { id: 'medium', name: 'Medium', capacity: '1kL-2.5kL', icon: 'download' },
      { id: 'large', name: 'Large', capacity: '5000L+', icon: 'business' }
    ],
     isQuoteRequest: true,
    priceRange: { min: 150, max: 600 },
    pricingUnit: 'per_job',
  },
};

export default function BookingScreen({ route, navigation }: any) {
  const { serviceType } = route.params || {};
  const currentService = SERVICE_DATA[serviceType] || SERVICE_DATA['1'];

    // Catch AR Scan data when returning from ARScanner
  React.useEffect(() => {
    if (route.params?.scannedArea) {
      // Map the scanned sq meters to the slider (e.g., 24.5m2 is roughly a 3-Bedroom, so slider value 3)
      // You can adjust this math later based on your exact pricing formula
      const mappedSliderValue = route.params.scannedArea > 30 ? 4 : route.params.scannedArea > 20 ? 3 : 2;
      setPropertySize(mappedSliderValue);
      
      // Clear the param so it doesn't trigger again
      navigation.setParams({ scannedArea: undefined });
    }
  }, [route.params?.scannedArea]);

  // State for Items (Laundry)
  const [quantities, setQuantities] = useState<any>(() => {
    const initialQty: any = {};
    if (currentService.items) currentService.items.forEach((item: any) => { initialQty[item.id] = 0; });
    return initialQty;
  });

  // State for Slider & Form (Deep Cleaning & Fumigation)
  const [propertySize, setPropertySize] = useState(1);
  const [selectedFumigationService, setSelectedFumigationService] = useState('cockroach');
  
  // State for Detailing
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [selectedPackage, setSelectedPackage] = useState('full');
  
  // State for Polytank & Sofa
  const [selectedTankSize, setSelectedTankSize] = useState('medium');
  const [sofaQuantities, setSofaQuantities] = useState<any>({ armchair: 0, '3seater': 0 });
  const [selectedCarpets, setSelectedCarpets] = useState<string[]>([]);
  const [enhancements, setEnhancements] = useState<any>({ stain_removal: false, eco_friendly: true });
  
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  
  // Shimmer Animation for Polytank
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    if (currentService.type === 'polytank' && !isBooking) {
      Animated.loop(Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true })).start();
    }
  }, [currentService.type, isBooking]);

  const totalPrice = useMemo(() => {
    if (currentService.type === 'items') {
      return currentService.items.reduce((total: number, item: any) => total + (quantities[item.id] || 0) * item.price, 0);
    } else if (currentService.type === 'slider') {
      return Math.floor(currentService.basePrice * currentService.multipliers[propertySize - 1]);
    } else if (currentService.type === 'fumigation') {
      const service = currentService.services.find((s: any) => s.id === selectedFumigationService);
      return Math.round((service ? service.basePrice : 300) * (currentService.sizeMultipliers[propertySize - 1] || 1));
    } else if (currentService.type === 'detailing') {
      const pkg = currentService.packages.find((p: any) => p.id === selectedPackage);
      return pkg ? pkg.price : 0;
    } else if (currentService.type === 'sofa') {
      let total = 0;
      currentService.sofaItems.forEach((item: any) => { total += (sofaQuantities[item.id] || 0) * item.price; });
      selectedCarpets.forEach(() => { total += 150; }); // Mock flat rate as per HTML
      if (enhancements.stain_removal) total += 50;
      if (enhancements.eco_friendly) total += 20;
      return total;
    }
    return currentService.startPrice || 0;
  }, [quantities, propertySize, selectedFumigationService, selectedPackage, sofaQuantities, selectedCarpets, enhancements, currentService]);

  const updateQty = async (id: string, delta: number) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantities((prev: any) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  };

  const updateSofaQty = async (id: string, delta: number) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSofaQuantities((prev: any) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  };

  const toggleCarpet = async (id: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCarpets((prev: string[]) => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleEnhancement = async (id: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnhancements((prev: any) => ({ ...prev, [id]: !prev[id] }));
  };

    const handleConfirm = async () => {
    if (totalPrice === 0 && currentService.type === 'items') {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (currentService.type === 'polytank' || currentService.type === 'detailing' || currentService.type === 'sofa') {
      setIsBooking(true);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        setIsBooking(false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate to Checkout with dynamic price and title
        navigation.navigate('Checkout', { 
  totalPrice: totalPrice, 
  serviceTitle: currentService.title,
  serviceId: serviceType,
  serviceType: serviceType
});
      }, 800);
      return;
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Navigate to Checkout for all other services too
    navigation.navigate('Checkout', { 
  totalPrice: totalPrice, 
  serviceTitle: currentService.title,
  serviceType: serviceType
});
  };
  // --- RENDER: SOFA VIEW ---
  const renderSofaView = () => (
    <>
      <View style={styles.sofaHero}>
        <Image source={{ uri: currentService.heroImage }} style={styles.sofaHeroImage} />
        <View style={styles.sofaHeroOverlay} />
        <View style={styles.sofaHeroBadge}>
          <Ionicons name="star" size={16} color={COLORS.secondaryContainer} />
          <Text style={styles.sofaHeroBadgeText}>{currentService.badge}</Text>
        </View>
        <View style={styles.sofaHeroContent}>
          <Text style={styles.sofaHeroTitle}>{currentService.title}</Text>
          <View style={styles.sofaHeroRating}>
            <Ionicons name="star" size={16} color={COLORS.secondaryContainer} />
            <Text style={styles.sofaHeroRatingText}>4.9 (120+ Reviews)</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Select Sofa Type</Text>
          <View style={styles.sofaTypeBadge}><Text style={styles.sofaTypeBadgeText}>Deep Clean</Text></View>
        </View>
        {currentService.sofaItems.map((item: any) => (
          <View key={item.id} style={styles.sofaItemCard}>
            <View style={styles.sofaItemLeft}>
              <View style={styles.sofaItemIcon}><MaterialCommunityIcons name={item.icon as any} size={28} color={COLORS.primary} /></View>
              <View>
                <Text style={styles.sofaItemName}>{item.name}</Text>
                <Text style={styles.sofaItemPrice}>GH₵ {item.price} / unit</Text>
              </View>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => updateSofaQty(item.id, -1)}>
                <Ionicons name="remove" size={18} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
              <Text style={styles.stepperCount}>{sofaQuantities[item.id] || 0}</Text>
              <TouchableOpacity style={[styles.stepperBtn, styles.stepperBtnActive]} onPress={() => updateSofaQty(item.id, 1)}>
                <Ionicons name="add" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carpet & Rugs</Text>
        <View style={styles.carpetGrid}>
          {currentService.carpetItems.map((carpet: any) => {
            const isSelected = selectedCarpets.includes(carpet.id);
            return (
              <TouchableOpacity key={carpet.id} style={[styles.carpetCard, isSelected && styles.carpetCardSelected]} onPress={() => toggleCarpet(carpet.id)} activeOpacity={0.8}>
                <View style={[styles.carpetIconBox, isSelected ? styles.carpetIconBoxSelected : {}]}>
                  <Ionicons name={carpet.icon as any} size={24} color={isSelected ? COLORS.white : COLORS.secondaryContainer} />
                </View>
                <Text style={styles.carpetName}>{carpet.name}</Text>
                <Text style={styles.carpetPrice}>GH₵ {carpet.price} / {carpet.unit}</Text>
                {isSelected && <View style={styles.carpetCheck}><Ionicons name="checkmark-circle" size={18} color={COLORS.secondaryContainer} /></View>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Enhancements</Text>
        <View style={styles.enhancementsCard}>
          {currentService.enhancements.map((enh: any, index: number) => (
            <React.Fragment key={enh.id}>
              <View style={styles.enhancementRow}>
                <View style={styles.enhancementLeft}>
                  <Ionicons name={enh.icon as any} size={24} color={COLORS.primary} />
                  <View>
                    <Text style={styles.enhancementName}>{enh.name}</Text>
                    <Text style={styles.enhancementDesc}>{enh.desc}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.toggle, enhancements[enh.id] ? styles.toggleActive : styles.toggleInactive]} onPress={() => toggleEnhancement(enh.id)}>
                  <View style={[styles.toggleThumb, enhancements[enh.id] ? styles.toggleThumbActive : {}]} />
                </TouchableOpacity>
              </View>
              {index < currentService.enhancements.length - 1 && <View style={styles.enhancementDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationIconBox}><Ionicons name="location" size={20} color={COLORS.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Service Location</Text>
            <Text style={styles.locationValue} numberOfLines={1}>East Legon, Plot 42, Accra</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.onSurfaceVariant} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {['MON', 'TUE', 'WED', 'THU'].map((day, i) => {
            const date = 14 + i;
            const isSelected = i === 0;
            return (
              <TouchableOpacity key={day} style={[styles.dateCard, isSelected ? styles.dateCardActive : styles.dateCardInactive]}>
                <Text style={[styles.dateDayText, isSelected ? styles.dateDayTextActive : {}]}>{day}</Text>
                <Text style={[styles.dateNumText, isSelected ? styles.dateNumTextActive : {}]}>{date}</Text>
                <Text style={[styles.dateMonthText, isSelected ? styles.dateMonthTextActive : {}]}>AUG</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.sofaStickyFooter}>
        <View>
          <Text style={styles.sofaFooterLabel}>Estimate Total</Text>
          <Text style={styles.sofaFooterTotal}>GH₵ {totalPrice}</Text>
        </View>
        <TouchableOpacity style={styles.sofaConfirmBtn} onPress={handleConfirm} activeOpacity={0.8} disabled={isBooking}>
          {isBooking ? <Ionicons name="refresh" size={20} color={COLORS.white} /> : (
            <>
              <Text style={styles.sofaConfirmText}>Confirm Booking</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // --- RENDER: ITEMS VIEW (Laundry) ---
  const renderItemsView = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIconContainer}><Ionicons name={currentService.icon as any} size={48} color={COLORS.white} /></View>
        <Text style={styles.heroTitle}>{currentService.title}</Text>
        <Text style={styles.heroSubtitle}>{currentService.subtitle}</Text>
        <View style={styles.heroTags}>
          <View style={styles.tag}><Ionicons name="time-outline" size={14} color={COLORS.white} /><Text style={styles.tagText}>24h Turnaround</Text></View>
          <View style={styles.tag}><Ionicons name="star" size={14} color={COLORS.white} /><Text style={styles.tagText}>4.9 (2.1k)</Text></View>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Select Items</Text>
          <TouchableOpacity onPress={() => {
            const resetQty: any = {};
            currentService.items.forEach((item: any) => { resetQty[item.id] = 0; });
            setQuantities(resetQty);
          }}><Text style={styles.clearText}>Clear all</Text></TouchableOpacity>
        </View>
        {currentService.items.map((item: any) => (
          <View key={item.id} style={[styles.itemRow, (quantities[item.id] || 0) > 0 && styles.itemRowActive]}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIcon}><Ionicons name={item.icon as any} size={24} color={COLORS.primary} /></View>
              <View><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemPrice}>₵{item.price.toFixed(2)} / unit</Text></View>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQty(item.id, -1)}><Text style={styles.stepperText}>-</Text></TouchableOpacity>
              <Text style={styles.stepperCount}>{quantities[item.id] || 0}</Text>
              <TouchableOpacity style={[styles.stepperBtn, styles.stepperBtnActive]} onPress={() => updateQty(item.id, 1)}><Text style={styles.stepperTextActive}>+</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // --- RENDER: SLIDER VIEW (Deep Cleaning) ---
  const renderSliderView = () => (
    <>
      <View style={styles.heroImageContainer}>
        <Image source={{ uri: currentService.heroImage }} style={styles.heroImage} />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.badge}><Text style={styles.badgeText}>{currentService.badge}</Text></View>
          <Text style={styles.heroImageTitle}>{currentService.title}</Text>
          <Text style={styles.heroImageSubtitle}>{currentService.subtitle}</Text>
        </View>
      </View>
      <View style={styles.infoCard}>
        <View style={styles.infoLeft}>
          <View style={styles.infoIcon}><Ionicons name="shield-checkmark" size={20} color={COLORS.primary} /></View>
          <View><Text style={styles.infoTitle}>{currentService.infoTitle}</Text><Text style={styles.infoSubtitle}>{currentService.infoSubtitle}</Text></View>
        </View>
        <TouchableOpacity><Ionicons name="information-circle-outline" size={24} color={COLORS.outline} /></TouchableOpacity>
      </View>
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Property Size</Text>
          <Text style={styles.sliderValue}>{propertySize > 5 ? '5+' : propertySize}</Text>
        </View>
        <Slider style={styles.slider} minimumValue={1} maximumValue={6} step={1} value={propertySize} minimumTrackTintColor={COLORS.primary} maximumTrackTintColor={COLORS.surfaceContainerHighest} thumbTintColor={COLORS.primary} onValueChange={(value: number) => { setPropertySize(value); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} />
        <View style={styles.sliderLabels}>{currentService.labels.map((label: string, index: number) => (<Text key={index} style={styles.sliderLabelText}>{label}</Text>))}</View>
                <View style={styles.sliderLabels}>
          {currentService.labels.map((label: string, index: number) => (<Text key={index} style={styles.sliderLabelText}>{label}</Text>))}
        </View>

        {/* --- ADD THIS NEW AR BUTTON --- */}
           <TouchableOpacity 
     style={styles.arButton} 
     onPress={() => navigation.navigate('ARScanner', { serviceType: serviceType })} // <-- FIX THIS
     activeOpacity={0.8}
   >
          <Ionicons name="scan-outline" size={20} color={COLORS.primary} />
          <Text style={styles.arButtonText}>Scan Room with AR for exact size</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.priceCard}>
        <View><Text style={styles.priceLabel}>Estimated Total</Text><View style={{ flexDirection: 'row', alignItems: 'baseline' }}><Text style={styles.priceCurrency}>GH₵</Text><Text style={styles.priceValue}>{totalPrice}</Text></View></View>
        <View style={{ alignItems: 'flex-end' }}><Text style={styles.priceSub}>Includes taxes</Text><Text style={styles.priceTime}>~{(propertySize * 1.5).toFixed(1)} hrs labor</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}><Ionicons name="location-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Service Address" value={location} onChangeText={setLocation} /></View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}><TextInput style={styles.input} placeholder="Date" value={date} onChangeText={setDate} /></View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}><TextInput style={styles.input} placeholder="Time" value="08:00 AM" /></View>
          </View>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm} activeOpacity={0.8}><Ionicons name="calendar" size={20} color={COLORS.white} /><Text style={styles.primaryBtnText}>Book Professional Now</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}><Text style={styles.secondaryBtnText}>Request Custom Quote</Text></TouchableOpacity>
      </View>
    </>
  );

  // --- RENDER: FUMIGATION VIEW ---
  const renderFumigationView = () => (
    <>
      <View style={styles.fumigationHero}>
        <View style={styles.fumigationIconContainer}><Ionicons name="bug-outline" size={48} color={COLORS.primary} /></View>
        <Text style={styles.fumigationTitle}>{currentService.title}</Text>
        <Text style={styles.fumigationSubtitle}>{currentService.subtitle}</Text>
        <View style={styles.fumigationBadge}><Ionicons name="shield-checkmark" size={18} color="#572000" /><Text style={styles.fumigationBadgeText}>{currentService.badge}</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What are we fighting?</Text>
        <View style={styles.serviceGrid}>
          {currentService.services.map((service: any) => {
            const isSelected = selectedFumigationService === service.id;
            const iconColor = service.id === 'bedbug' ? '#ba1a1a' : service.id === 'general' ? COLORS.secondaryContainer : COLORS.primary;
            const bgColor = service.id === 'bedbug' ? 'rgba(186, 26, 26, 0.1)' : service.id === 'general' ? 'rgba(254, 107, 0, 0.1)' : 'rgba(0, 62, 199, 0.1)';
            return (
              <TouchableOpacity key={service.id} style={[styles.serviceCard, isSelected && styles.serviceCardSelected]} onPress={() => { setSelectedFumigationService(service.id); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <View style={[styles.serviceIconBox, { backgroundColor: bgColor }]}><Ionicons name={service.icon as any} size={24} color={iconColor} /></View>
                <Text style={styles.serviceCardText}>{service.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}><Text style={styles.sliderSectionTitle}>Property Size</Text><Text style={styles.sizeLabel}>{currentService.sizeLabels[propertySize - 1]}</Text></View>
        <Slider style={styles.slider} minimumValue={1} maximumValue={4} step={1} value={propertySize} minimumTrackTintColor={COLORS.primary} maximumTrackTintColor={COLORS.outlineVariant} thumbTintColor={COLORS.primary} onValueChange={(value: number) => { setPropertySize(value); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} />
        <View style={styles.sliderLabels}><Text style={styles.sliderLabelText}>Studio</Text><Text style={styles.sliderLabelText}>4+ Bed</Text></View>
           <TouchableOpacity 
     style={styles.arButton} 
     onPress={() => navigation.navigate('ARScanner', { serviceType: serviceType })}
     activeOpacity={0.8}
   >
     <Ionicons name="scan-outline" size={20} color={COLORS.primary} />
     <Text style={styles.arButtonText}>Scan Room with AR for exact size</Text>
   </TouchableOpacity>
      
      </View>
      <View style={styles.safetyCard}>
        <View style={styles.safetyIcon}><Ionicons name="information-circle" size={24} color={COLORS.primary} /></View>
        <View style={{ flex: 1 }}><Text style={styles.safetyTitle}>Safety First</Text><Text style={styles.safetyText}>Please ensure all food is covered and pets/humans vacate for 4 hours post-service.</Text></View>
      </View>
      <View style={styles.priceCardFumigation}>
        <View><Text style={styles.priceLabelFumigation}>Estimated Cost</Text><View style={{ flexDirection: 'row', alignItems: 'baseline' }}><Text style={styles.priceCurrencyFumigation}>GH₵</Text><Text style={styles.priceValueFumigation}>{totalPrice}</Text></View></View>
        <View style={{ alignItems: 'flex-end' }}><Text style={styles.priceBadge}>Instant Quote</Text><Text style={styles.priceSub}>Includes VAT</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}><Ionicons name="location-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Service Address" value={location} onChangeText={setLocation} /></View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}><Ionicons name="calendar-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Date" value={date} onChangeText={setDate} /></View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}><Ionicons name="time-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Time" value="08:00 AM" /></View>
          </View>
          <TouchableOpacity style={styles.paymentRow}>
            <View style={styles.paymentIconBox}><Ionicons name="wallet-outline" size={20} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}><Text style={styles.paymentTitle}>Payment Method</Text><Text style={styles.paymentSubtitle}>Mobile Money (MTN/Telecel)</Text></View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.outline} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.fumigationConfirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
        <Text style={styles.fumigationConfirmText}>Confirm Booking</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </>
  );

  // --- RENDER: POLYTANK VIEW ---
  const renderPolytankView = () => {
    const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [-1, 1], outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH] });
    return (
      <>
        <View style={styles.polytankHero}>
          <Image source={{ uri: currentService.heroImage }} style={styles.polytankHeroImage} />
          <View style={styles.polytankHeroOverlay} />
          <View style={styles.polytankFloatingBadge}>
            <Ionicons name="wallet-outline" size={18} color="#572000" />
            <Text style={styles.polytankBadgeText}>{currentService.badge}</Text>
          </View>
        </View>
        <View style={styles.polytankContentCard}>
          <View style={styles.polytankHeaderRow}>
            <View>
              <Text style={styles.polytankTitle}>{currentService.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                <Text style={styles.polytankVerified}>Certified Industrial Grade</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}><Text style={styles.polytankStartsFrom}>Starts from</Text><Text style={styles.polytankPrice}>₵{currentService.startPrice}</Text></View>
          </View>
          <Text style={styles.polytankDescription}>{currentService.subtitle}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Tank Capacity</Text>
          <View style={styles.sizeGrid}>
            {currentService.sizes.map((size: any) => {
              const isSelected = selectedTankSize === size.id;
              return (
                <TouchableOpacity key={size.id} style={[styles.sizeBtn, isSelected ? styles.sizeBtnActive : styles.sizeBtnInactive]} onPress={() => { setSelectedTankSize(size.id); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Ionicons name={size.icon as any} size={24} color={isSelected ? COLORS.white : COLORS.onSurfaceVariant} style={{ marginBottom: 8 }} />
                  <Text style={[styles.sizeBtnText, isSelected && styles.sizeBtnTextActive]}>{size.name}</Text>
                  <Text style={[styles.sizeBtnCapacity, isSelected && { color: 'rgba(255,255,255,0.9)' }]}>{size.capacity}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}><Ionicons name="location-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Enter your neighborhood (e.g. Ahodwo)" value={location} onChangeText={setLocation} /></View>
            <View style={styles.inputGroup}><Ionicons name="calendar-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Preferred Date" value={date} onChangeText={setDate} /></View>
            <View style={styles.textAreaGroup}><TextInput style={styles.textArea} placeholder="Access codes, multiple tanks, or specific issues..." multiline numberOfLines={3} value={location} onChangeText={setLocation} /></View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Trusted by 200+</Text><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="star" size={18} color={COLORS.secondaryContainer} /><Text style={styles.ratingText}>4.9 (84 reviews)</Text></View></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewList}>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={[styles.reviewAvatar, { backgroundColor: COLORS.tertiaryContainer, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.onTertiaryContainer }}>KA</Text></View>
                <View><Text style={styles.reviewName}>Kwame A.</Text><View style={styles.stars}>{[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={12} color={COLORS.secondaryContainer} />)}</View></View>
              </View>
              <Text style={styles.reviewText} numberOfLines={2}>"The team was very thorough. My water is finally clear again. Great value for money."</Text>
            </View>
          </ScrollView>
        </View>
        <View style={styles.stickyActions}>
          <TouchableOpacity style={styles.quoteBtn} activeOpacity={0.8}><Ionicons name="document-text-outline" size={20} color={COLORS.onSurface} /><Text style={styles.quoteBtnText}>Get Quote</Text></TouchableOpacity>
          <TouchableOpacity style={styles.bookInstantBtn} onPress={handleConfirm} activeOpacity={0.8} disabled={isBooking}>
            {isBooking ? <Ionicons name="refresh" size={20} color={COLORS.white} /> : (<><Text style={styles.bookInstantText}>Book Instant Clean</Text><Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} /></>)}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // --- RENDER: DETAILING VIEW ---
  const renderDetailingView = () => (
    <>
      <View style={styles.detailingHero}>
        <Image source={{ uri: currentService.heroImage }} style={styles.detailingHeroImage} />
        <View style={styles.detailingHeroOverlay} />
        <View style={styles.detailingHeroContent}>
          <View style={styles.detailingBadge}><Text style={styles.detailingBadgeText}>{currentService.badge}</Text></View>
          <Text style={styles.detailingHeroText}>{currentService.subtitle}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Vehicle</Text>
        <View style={styles.vehicleToggleContainer}>
          {currentService.vehicles.map((v: any) => {
            const isSelected = selectedVehicle === v.id;
            return (
              <TouchableOpacity key={v.id} style={[styles.vehicleToggle, isSelected && styles.vehicleToggleActive]} onPress={() => { setSelectedVehicle(v.id); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Ionicons name={v.icon as any} size={24} color={isSelected ? COLORS.white : COLORS.onSurfaceVariant} />
                <Text style={[styles.vehicleToggleText, isSelected && styles.vehicleToggleTextActive]}>{v.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Package</Text>
        {currentService.packages.map((pkg: any) => {
          const isSelected = selectedPackage === pkg.id;
          return (
            <TouchableOpacity key={pkg.id} style={[styles.packageCard, isSelected && styles.packageCardActive]} onPress={() => { setSelectedPackage(pkg.id); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <View style={[styles.packageIconBox, { backgroundColor: pkg.color }]}><Ionicons name={pkg.icon as any} size={24} color={pkg.textColor} /></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  {pkg.popular && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>Popular</Text></View>}
                </View>
                <Text style={styles.packageDesc}>{pkg.desc}</Text>
              </View>
              <Text style={styles.packagePrice}>₵{pkg.price}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}><Ionicons name="location-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Street, City, Postcode" value={location} onChangeText={setLocation} /></View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}><Ionicons name="calendar-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Preferred Date" value={date} onChangeText={setDate} /></View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}><Ionicons name="time-outline" size={20} color={COLORS.outline} style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Time Slot" value="09:00 AM" /></View>
          </View>
          <TouchableOpacity style={styles.paymentRow}>
            <View style={styles.paymentIconBox}><View style={{ flexDirection: 'row', gap: 4 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ba1a1a' }} /><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.secondaryContainer }} /></View></View>
            <View style={{ flex: 1 }}><Text style={styles.paymentTitle}>•••• 4242</Text></View>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.detailingConfirmBtn} onPress={handleConfirm} activeOpacity={0.8} disabled={isBooking}>
        {isBooking ? <Ionicons name="refresh" size={20} color={COLORS.white} /> : (<><Text style={styles.detailingConfirmText}>Confirm Booking</Text><Ionicons name="arrow-forward" size={20} color={COLORS.white} /></>)}
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={COLORS.onSurface} /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDolCkLrbtEMfue_L5daYQPY3OJINLp8pXTYLMTSnifWvhjGcOegRWTXgz8txA2-h5lb6-8e8iPvRhud2y5hwQ6lTdsJ-pMpBsYDMB-pJi7-Y_G2fcvoh2vrlIO-bgypxbqTAGWPpZiJAou9FZ3JvyEbvgO-oIqe-Yf4-3c69h31hqpXmxmi7KL2kKhBVIWOWsx3vYCqjCH0hb9vG7KFuoKKkQdfX8cTI-LjwMwGLxIBS4emHvc9Xpg' }} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle} numberOfLines={1}>Booking Detail</Text>
        </View>
        <View style={styles.profileBadge}><Ionicons name="person" size={18} color={COLORS.white} /></View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentService.type === 'items' && renderItemsView()}
        {currentService.type === 'slider' && renderSliderView()}
        {currentService.type === 'fumigation' && renderFumigationView()}
        {currentService.type === 'polytank' && renderPolytankView()}
        {currentService.type === 'detailing' && renderDetailingView()}
        {currentService.type === 'sofa' && renderSofaView()}
        
        <View style={{ height: currentService.type === 'polytank' || currentService.type === 'detailing' || currentService.type === 'sofa' ? 100 : 120 }} />
      </ScrollView>

      {currentService.type === 'items' && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomRow}>
            <View><Text style={styles.totalLabel}>Total Estimate</Text><View style={{ flexDirection: 'row', alignItems: 'baseline' }}><Text style={styles.totalCurrency}>₵</Text><Text style={styles.totalAmount}>{totalPrice.toFixed(2)}</Text></View></View>
          </View>
          <TouchableOpacity style={[styles.confirmBtn, totalPrice === 0 && styles.confirmBtnDisabled]} onPress={handleConfirm} activeOpacity={0.8}>
            <Text style={styles.confirmText}>Confirm Booking</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PADDING, paddingTop: 50, paddingBottom: 16, backgroundColor: 'rgba(248, 249, 250, 0.9)', borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainer },
  backBtn: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12 },
  headerLogo: { width: 24, height: 24 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  profileBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  
  hero: { backgroundColor: COLORS.primary, padding: 32, alignItems: 'center', paddingTop: 40, paddingBottom: 48 },
  heroIconContainer: { width: 80, height: 80, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: COLORS.white, marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 16, maxWidth: 280 },
  heroTags: { flexDirection: 'row', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '500', color: COLORS.white },
  card: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, padding: 20, marginHorizontal: PADDING, marginTop: -24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  clearText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 12, marginBottom: 8 },
  itemRowActive: { backgroundColor: COLORS.primaryFixed },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  itemPrice: { fontSize: 12, fontWeight: '500', color: COLORS.outline, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, padding: 4 },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  stepperBtnActive: { backgroundColor: COLORS.primary },
  stepperText: { fontSize: 16, fontWeight: '600', color: COLORS.onSurfaceVariant },
  stepperTextActive: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  stepperCount: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, width: 20, textAlign: 'center' },

  heroImageContainer: { width: '100%', aspectRatio: 1.6, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: PADDING },
  badge: { backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#572000' },
  heroImageTitle: { fontSize: 28, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  heroImageSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  infoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 12, padding: 16, marginHorizontal: PADDING, marginTop: -24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  infoSubtitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  section: { marginTop: 24, paddingHorizontal: PADDING },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  sliderValue: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  sliderLabelText: { fontSize: 12, fontWeight: '500', color: COLORS.outline },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 82, 255, 0.1)', borderRadius: 16, padding: 20, marginHorizontal: PADDING, marginTop: 24, borderWidth: 2, borderColor: 'rgba(0, 62, 199, 0.2)', borderStyle: 'dashed' },
  priceLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  priceCurrency: { fontSize: 32, fontWeight: '800', color: COLORS.onBackground },
  priceValue: { fontSize: 32, fontWeight: '800', color: COLORS.onBackground },
  priceSub: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  priceTime: { fontSize: 12, fontWeight: '700', color: COLORS.primary, fontStyle: 'italic', marginTop: 4 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12, height: 52, paddingHorizontal: 16, marginBottom: 12 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: '100%', fontSize: 16, color: COLORS.onSurface, fontWeight: '500' },
  row: { flexDirection: 'row' },
  actionButtons: { paddingHorizontal: PADDING, marginTop: 24, gap: 12 },
  primaryBtn: { height: 52, backgroundColor: COLORS.primary, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  secondaryBtn: { height: 52, backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },

  fumigationHero: { padding: 32, alignItems: 'center', paddingTop: 20, paddingBottom: 32 },
  fumigationIconContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  fumigationTitle: { fontSize: 28, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8, textAlign: 'center' },
  fumigationSubtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, textAlign: 'center', maxWidth: 280, marginBottom: 16 },
  fumigationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  fumigationBadgeText: { fontSize: 14, fontWeight: '600', color: '#572000' },
  serviceGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  serviceCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 2, borderColor: 'transparent' },
  serviceCardSelected: { borderColor: COLORS.primary },
  serviceIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  serviceCardText: { fontSize: 12, fontWeight: '500', color: COLORS.onSurface, textAlign: 'center' },
  sliderSection: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 20, marginHorizontal: PADDING, marginTop: 24 },
  sliderSectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  sizeLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary, backgroundColor: COLORS.primaryFixed, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  safetyCard: { flexDirection: 'row', gap: 16, backgroundColor: 'rgba(67, 70, 86, 0.05)', borderRadius: 16, padding: 20, marginHorizontal: PADDING, marginTop: 24, alignItems: 'flex-start' },
  safetyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  safetyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, marginBottom: 4 },
  safetyText: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, lineHeight: 18 },
  priceCardFumigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 16, padding: 24, marginHorizontal: PADDING, marginTop: 24 },
  priceLabelFumigation: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  priceCurrencyFumigation: { fontSize: 32, fontWeight: '700', color: COLORS.white },
  priceValueFumigation: { fontSize: 32, fontWeight: '700', color: COLORS.white },
  priceBadge: { fontSize: 12, fontWeight: '600', color: COLORS.white, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12, padding: 16, marginTop: 4 },
  paymentIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  paymentTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  paymentSubtitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 2 },
  fumigationConfirmBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: PADDING, marginTop: 24, marginBottom: 20 },
  fumigationConfirmText: { fontSize: 16, fontWeight: '600', color: COLORS.white },

  polytankHero: { width: '100%', height: 288, position: 'relative' },
  polytankHeroImage: { width: '100%', height: '100%' },
  polytankHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 62, 199, 0.1)' },
  polytankFloatingBadge: { position: 'absolute', bottom: 24, left: PADDING, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  polytankBadgeText: { fontSize: 14, fontWeight: '600', color: '#572000' },
  polytankContentCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 12, padding: 20, marginHorizontal: PADDING, marginTop: -16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  polytankHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  polytankTitle: { fontSize: 24, fontWeight: '700', color: COLORS.onSurface },
  polytankVerified: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  polytankStartsFrom: { fontSize: 12, fontWeight: '600', color: COLORS.outline, textTransform: 'uppercase', letterSpacing: 1 },
  polytankPrice: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  polytankDescription: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 24 },
  sizeGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  sizeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 2 },
  sizeBtnInactive: { backgroundColor: COLORS.surfaceContainerHigh, borderColor: 'transparent' },
  sizeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sizeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  sizeBtnTextActive: { color: COLORS.white },
  sizeBtnCapacity: { fontSize: 10, fontWeight: '500', color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
  textAreaGroup: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 16, marginTop: 4 },
  textArea: { fontSize: 16, color: COLORS.onSurface, fontWeight: '500', textAlignVertical: 'top' },
  stickyActions: { flexDirection: 'row', gap: 12, paddingHorizontal: PADDING, paddingBottom: 30, paddingTop: 16, backgroundColor: 'rgba(248, 249, 250, 0.9)' },
  quoteBtn: { flex: 1, height: 52, backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  quoteBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  bookInstantBtn: { flex: 2, height: 52, backgroundColor: COLORS.primary, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, overflow: 'hidden' },
  bookInstantText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  shimmer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.2)', transform: [{ skewX: '-20deg' }] },

  detailingHero: { width: '100%', aspectRatio: 1.6, position: 'relative', marginBottom: 16, marginHorizontal: PADDING },
  detailingHeroImage: { width: '100%', height: '100%', borderRadius: 24 },
  detailingHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 24 },
  detailingHeroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  detailingBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  detailingBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.white },
  detailingHeroText: { fontSize: 16, color: COLORS.white, fontWeight: '500', lineHeight: 22 },
  vehicleToggleContainer: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 16, padding: 4, gap: 4 },
  vehicleToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  vehicleToggleActive: { backgroundColor: COLORS.primary },
  vehicleToggleText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  vehicleToggleTextActive: { color: COLORS.white },
  packageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  packageCardActive: { borderColor: 'rgba(0, 62, 199, 0.4)', shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  packageIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  packageName: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  packageDesc: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 4 },
  popularBadge: { backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  popularBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#572000', letterSpacing: 0.5 },
  packagePrice: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  detailingConfirmBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: PADDING, marginTop: 24, marginBottom: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  detailingConfirmText: { fontSize: 16, fontWeight: '600', color: COLORS.white },

  // Sofa Styles
  sofaHero: { width: '100%', height: 288, position: 'relative' },
  sofaHeroImage: { width: '100%', height: '100%' },
  sofaHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sofaHeroBadge: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  sofaHeroBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.white, letterSpacing: 1 },
  sofaHeroContent: { position: 'absolute', bottom: 24, left: PADDING, right: PADDING },
  sofaHeroTitle: { fontSize: 28, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  sofaHeroRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sofaHeroRatingText: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sofaTypeBadge: { backgroundColor: COLORS.primaryFixed, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  sofaTypeBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  sofaItemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sofaItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sofaItemIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  sofaItemName: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  sofaItemPrice: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 2 },
  carpetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  carpetCard: { width: (SCREEN_WIDTH - (PADDING * 2) - 12) / 2, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, position: 'relative' },
  carpetCardSelected: { backgroundColor: COLORS.primaryFixed },
  carpetIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.surfaceContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  carpetIconBoxSelected: { backgroundColor: COLORS.secondaryContainer },
  carpetName: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  carpetPrice: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 4 },
  carpetCheck: { position: 'absolute', bottom: 16, right: 16 },
  enhancementsCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  enhancementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  enhancementLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  enhancementName: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  enhancementDesc: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleInactive: { backgroundColor: COLORS.surfaceContainerHighest },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
  enhancementDivider: { height: 1, backgroundColor: COLORS.surfaceContainer, marginHorizontal: 16 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainer, borderRadius: 24, padding: 16, marginBottom: 12 },
  locationIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  locationLabel: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  locationValue: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, marginTop: 2 },
  dateScroll: { gap: 12, paddingBottom: 4 },
  dateCard: { width: 80, height: 96, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dateCardActive: { backgroundColor: COLORS.primary },
  dateCardInactive: { backgroundColor: COLORS.surfaceContainerLowest },
  dateDayText: { fontSize: 12, fontWeight: '500', opacity: 0.8 },
  dateDayTextActive: { color: 'rgba(255,255,255,0.8)' },
  dateNumText: { fontSize: 24, fontWeight: '700' },
  dateNumTextActive: { color: COLORS.white },
  dateMonthText: { fontSize: 12, fontWeight: '500', opacity: 0.8 },
  dateMonthTextActive: { color: 'rgba(255,255,255,0.8)' },
  sofaStickyFooter: { position: 'absolute', bottom: 80, left: PADDING, right: PADDING, backgroundColor: 'rgba(248, 249, 250, 0.9)', borderRadius: 32, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  sofaFooterLabel: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  sofaFooterTotal: { fontSize: 24, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  sofaConfirmBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sofaConfirmText: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ratingText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, marginLeft: 4 },
  reviewList: { gap: 12, paddingRight: PADDING },
  reviewCard: { width: 280, backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16 },
  reviewName: { fontSize: 12, fontWeight: '500', color: COLORS.onSurface },
  stars: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewText: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 20, fontStyle: 'italic' },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: 16, paddingBottom: 30, borderTopWidth: 1, borderTopColor: COLORS.surfaceContainerHigh },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontSize: 12, fontWeight: '500', color: COLORS.outline },
  totalCurrency: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  totalAmount: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  confirmBtn: { height: 52, backgroundColor: COLORS.primary, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
    arButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, 
    backgroundColor: COLORS.primaryFixed, paddingVertical: 12, borderRadius: 12, marginTop: 16 
  },
  arButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});