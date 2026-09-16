import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

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
  outlineVariant: '#c3c5d9',
  white: '#ffffff',
  green: '#16a34a',
  momoYellow: '#FFCC00',
};

const NETWORKS = ['MTN', 'Telecel', 'AT'];

export default function CheckoutScreen({ route, navigation }: any) {
  // 1. Extract dynamic data from navigation params
  const { totalPrice: routePrice, serviceTitle: routeTitle, serviceId, serviceType } = route.params || {};
  const displayPrice = routePrice || 145.00;
  const displayTitle = routeTitle || 'Premium Express Logistics';
  
  // 2. Declare ALL state variables
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | 'apple'>('momo');
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [momoNumber, setMomoNumber] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 3. Animation for the "liquid" background effect
  const fadeAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.8, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePaymentSelect = async (method: 'momo' | 'card' | 'apple') => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaymentMethod(method);
  };

  const handleNetworkSelect = async (network: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNetwork(network);
  }; 

      const handleCompletePayment = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    
    try {
      const newOrderId = `ORD-${Date.now()}`;
      
      // ⚠️ REPLACE THIS WITH YOUR ACTUAL CLIENT UUID FROM THE 'clients' TABLE
      const testClientId = '057b4ebf-cbe3-44fc-bd53-781026d50a14'; 

      // Determine if this is a quote request (non-laundry) or instant booking (laundry)
      // serviceType '1' = laundry, everything else = quote request
      const isQuoteRequest = serviceType !== '1';
      const orderStatus = isQuoteRequest ? 'Quote Requested' : 'Pending';

      // Insert into orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: newOrderId,
          client_id: testClientId,
          status: orderStatus, // Now uses 'Quote Requested' for non-laundry
          total_due: displayPrice,
          amount_paid: 0,
          notes: isQuoteRequest 
            ? `QUOTE REQUEST - Mobile app booking for ${displayTitle}. Staff to assess and provide exact quote.`
            : `Mobile app booking for ${displayTitle}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert into order_items table
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          service_id: '15eb9f43-3f0d-4e26-8522-5b8a71a1d65a', // Will fix this next
          quantity: 1,
          unit_price: displayPrice,
        });

      if (itemError) throw itemError;

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to Tracking (for laundry) or a "Quote Submitted" screen (for others)
      navigation.replace('Tracking'); 

    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please check console for details.');
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Checkout & Payment</Text>
        </View>
        <View style={styles.profileBadge}>
          <Ionicons name="person" size={18} color={COLORS.white} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Animated Gradient */}
        <View style={styles.heroSection}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <LinearGradient
              colors={['#0a0a1a', '#003ec7', '#fe6b00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            />
          </Animated.View>
          
          <View style={styles.heroContent}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryLabel}>Service Selected</Text>
                  <Text style={styles.summaryTitle}>{displayTitle}</Text>
                </View>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="car-sport" size={24} color={COLORS.primary} />
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryFooter}>
                <View>
                  <Text style={styles.summaryLabel}>Estimated Delivery</Text>
                  <Text style={styles.summaryValue}>Today, 4:30 PM</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.totalAmount}>₵{displayPrice.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Main Form Area */}
        <View style={styles.formArea}>
          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <TouchableOpacity 
              style={[styles.paymentCard, paymentMethod === 'momo' && styles.paymentCardSelected]}
              onPress={() => handlePaymentSelect('momo')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconBox, { backgroundColor: COLORS.momoYellow }]}>
                  <Ionicons name="phone-portrait" size={28} color="#000" />
                </View>
                <View>
                  <Text style={styles.paymentTitle}>Mobile Money</Text>
                  <Text style={styles.paymentSubtitle}>MTN, Telecel, AT</Text>
                </View>
              </View>
              {paymentMethod === 'momo' && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentCard, paymentMethod === 'card' && styles.paymentCardSelected]}
              onPress={() => handlePaymentSelect('card')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconBox, { backgroundColor: COLORS.onSurface }]}>
                  <Ionicons name="card" size={28} color={COLORS.surface} />
                </View>
                <View>
                  <Text style={styles.paymentTitle}>Visa / Mastercard</Text>
                  <Text style={styles.paymentSubtitle}>Debit or Credit Card</Text>
                </View>
              </View>
              {paymentMethod === 'card' && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentCard, paymentMethod === 'apple' && styles.paymentCardSelected]}
              onPress={() => handlePaymentSelect('apple')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconBox, { backgroundColor: COLORS.white }]}>
                  <Ionicons name="logo-apple" size={28} color="#000" />
                </View>
                <View>
                  <Text style={styles.paymentTitle}>Apple Pay</Text>
                  <Text style={styles.paymentSubtitle}>Fast, secure checkout</Text>
                </View>
              </View>
              {paymentMethod === 'apple' && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
            </TouchableOpacity>
          </View>

          {/* Dynamic MoMo Details */}
          {paymentMethod === 'momo' && (
            <View style={styles.momoDetails}>
              <View style={styles.momoDetailsContent}>
                <Text style={styles.momoLabel}>Network Provider</Text>
                <View style={styles.networkGrid}>
                  {NETWORKS.map((network) => (
                    <TouchableOpacity
                      key={network}
                      style={[
                        styles.networkChip,
                        selectedNetwork === network && styles.networkChipSelected
                      ]}
                      onPress={() => handleNetworkSelect(network)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.networkChipText,
                        selectedNetwork === network && styles.networkChipTextSelected
                      ]}>
                        {network}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={[styles.momoLabel, { marginTop: 16 }]}>MoMo Number</Text>
                <TextInput
                  style={styles.momoInput}
                  placeholder="05X XXX XXXX"
                  placeholderTextColor={COLORS.onSurfaceVariant}
                  keyboardType="phone-pad"
                  value={momoNumber}
                  onChangeText={setMomoNumber}
                  maxLength={10}
                />
              </View>
            </View>
          )}

          {/* Promo Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Have a Promo Code?</Text>
            <View style={styles.promoContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter code"
                placeholderTextColor={COLORS.onSurfaceVariant}
                value={promoCode}
                onChangeText={setPromoCode}
              />
              <TouchableOpacity style={styles.promoBtn} activeOpacity={0.8}>
                <Text style={styles.promoBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CTA & Security */}
          <View style={styles.ctaSection}>
            <TouchableOpacity 
              style={styles.completeBtn} 
              onPress={handleCompletePayment}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <Ionicons name="refresh" size={24} color={COLORS.white} /> 
              ) : (
                <>
                  <Text style={styles.completeBtnText}>Complete Payment</Text>
                  <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.securityBadge}>
              <View style={styles.securityIcon}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.green} />
              </View>
              <Text style={styles.securityText}>Secured by Chapman</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PADDING, paddingTop: 50, paddingBottom: 16,
    backgroundColor: 'rgba(248, 249, 250, 0.6)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  profileBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  
  scrollView: { flex: 1 },
  
  heroSection: { width: '100%', paddingBottom: 40, position: 'relative' },
  gradientBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4 },
  heroContent: { paddingHorizontal: PADDING, position: 'relative', zIndex: 10 },
  summaryCard: {
    backgroundColor: 'rgba(248, 249, 250, 0.6)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  summaryTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface, marginTop: 4 },
  summaryIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(0, 62, 199, 0.1)', alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: COLORS.outlineVariant, marginVertical: 16 },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, marginTop: 4 },
  totalAmount: { fontSize: 28, fontWeight: '700', color: COLORS.primary, marginTop: 4 },

  formArea: { paddingHorizontal: PADDING, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, marginBottom: 12 },
  
  paymentCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 12, padding: 16, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  paymentCardSelected: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentIconBox: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  paymentTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  paymentSubtitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginTop: 2 },

  momoDetails: { marginBottom: 24 },
  momoDetailsContent: {
    backgroundColor: 'rgba(254, 107, 0, 0.1)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(254, 107, 0, 0.2)',
  },
  momoLabel: { fontSize: 12, fontWeight: '600', color: '#572000', marginBottom: 8 },
  networkGrid: { flexDirection: 'row', gap: 8 },
  networkChip: {
    flex: 1, height: 44, backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  networkChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  networkChipText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  networkChipTextSelected: { color: COLORS.white },
  momoInput: {
    height: 52, backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: COLORS.onSurface,
  },

  promoContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  promoInput: {
    flex: 1, height: 52, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: COLORS.onSurface,
    borderWidth: 1, borderColor: 'rgba(195, 197, 217, 0.3)',
  },
  promoBtn: {
    position: 'absolute', right: 8, height: 36, paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  promoBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  ctaSection: { marginTop: 16 },
  completeBtn: {
    height: 64, backgroundColor: COLORS.primary, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  completeBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  securityIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(22, 163, 74, 0.1)', alignItems: 'center', justifyContent: 'center' },
  securityText: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
});