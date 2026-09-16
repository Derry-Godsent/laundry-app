import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const PADDING = isSmallDevice ? 16 : 20;

const COLORS = {
  primary: '#003ec7',
  background: '#f8f9fa',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#edeeef',
  surfaceContainerHigh: '#e7e8e9',
  onBackground: '#191c1d',
  onSurface: '#191c1d',
  onSurfaceVariant: '#434656',
  outline: '#737688',
};

export default function LoginScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use 'any' for refs to bypass strict TypeScript crashes with TextInput
  const otpRefs = useRef<any[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length === 1 && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleSubmit = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsLoading(true);
    Keyboard.dismiss();

    // Simulate API call
   setTimeout(() => {
  setIsLoading(false);
  navigation.replace('MainTabs'); // This smoothly replaces Login with Home
}, 1800);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDolCkLrbtEMfue_L5daYQPY3OJINLp8pXTYLMTSnifWvhjGcOegRWTXgz8txA2-h5lb6-8e8iPvRhud2y5hwQ6lTdsJ-pMpBsYDMB-pJi7-Y_G2fcvoh2vrlIO-bgypxbqTAGWPpZiJAou9FZ3JvyEbvgO-oIqe-Yf4-3c69h31hqpXmxmi7KL2kKhBVIWOWsx3vYCqjCH0hb9vG7KFuoKKkQdfX8cTI-LjwMwGLxIBS4emHvc9Xpg' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome to Chapman Prestige Ltd.</Text>
          <Text style={styles.subtitle}>Secure login. No passwords needed.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={COLORS.outline}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputWrapper}>
            <View style={styles.phonePrefix}>
              <Text style={styles.prefixText}>+233</Text>
            </View>
            <TextInput
              style={[styles.input, { paddingLeft: 70 }]}
              placeholder="Mobile Number"
              placeholderTextColor={COLORS.outline}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={9}
            />
          </View>

          {/* OTP */}
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>Verification Code</Text>
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : styles.otpInputEmpty
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonLoading]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loader} />
            ) : (
              <Text style={styles.submitButtonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Already a client?</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>Sign in to existing account</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service & Privacy Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: PADDING, paddingTop: 60, paddingBottom: 50, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { width: 96, height: 96, backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoImage: { width: '100%', height: '100%' },
  title: { fontSize: isSmallDevice ? 24 : 28, fontWeight: '700', color: COLORS.onBackground, textAlign: 'center', lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '400', color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 24 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLowest, borderRadius: 12, height: 52, marginBottom: 16 },
  inputIcon: { marginLeft: 16, marginRight: 12 },
  input: { flex: 1, height: '100%', fontSize: 16, color: COLORS.onSurface, fontWeight: '500' },
  phonePrefix: { position: 'absolute', left: 16, flexDirection: 'row', alignItems: 'center' },
  prefixText: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  otpContainer: { marginBottom: 24 },
  otpLabel: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, marginBottom: 8, marginLeft: 4 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpInput: { flex: 1, height: 52, borderRadius: 12, fontSize: 24, fontWeight: '700', color: COLORS.onBackground, textAlign: 'center' },
  otpInputEmpty: { backgroundColor: COLORS.surfaceContainer },
  otpInputFilled: { backgroundColor: COLORS.surfaceLowest, borderWidth: 1.5, borderColor: COLORS.primary },
  submitButton: { height: 52, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  submitButtonLoading: { opacity: 0.8 },
  submitButtonText: { fontSize: 14, fontWeight: '600', color: '#ffffff', letterSpacing: 0.5 },
  loader: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.3)', borderTopColor: '#ffffff' },
  footer: { alignItems: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.surfaceContainerHigh },
  dividerText: { fontSize: 12, fontWeight: '500', color: COLORS.outline, marginHorizontal: 12 },
  secondaryButton: { width: '100%', height: 52, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  termsText: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, textAlign: 'center', opacity: 0.6, lineHeight: 18 },
});