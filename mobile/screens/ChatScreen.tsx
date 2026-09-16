import React, { useState, useRef, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const PADDING = isSmallDevice ? 16 : 20;

const COLORS = {
  primary: '#003ec7',
  primaryContainer: '#0052ff',
  primaryFixed: '#dde1ff',
  primaryFixedDim: '#b7c4ff',
  secondaryFixed: '#ffdbcc',
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
  green: '#16a34a',
};

const QUICK_ACTIONS = [
  { id: '1', title: 'Service Quote', icon: 'calculator-outline' },
  { id: '2', title: 'Repair Status', icon: 'construct-outline' },
  { id: '3', title: 'Bill Inquiry', icon: 'card-outline' },
  { id: '4', title: 'Security Log', icon: 'shield-checkmark-outline' },
];

export default function ChatScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'ai' | 'admin'>('ai');
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Animations
  const spinValue = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotating AI decoration
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Typing indicator bounce
    const bounceAnim = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };
    bounceAnim(dot1, 0);
    bounceAnim(dot2, 200);
    bounceAnim(dot3, 400);

    // Simulate typing indicator appearing in admin chat
    const typingTimer = setTimeout(() => {
      if (activeTab === 'admin') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }, 800);

    return () => {
      clearTimeout(typingTimer);
    };
  }, [activeTab]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleTabSwitch = async (tab: 'ai' | 'admin') => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    if (tab === 'admin') {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }, 800);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDolCkLrbtEMfue_L5daYQPY3OJINLp8pXTYLMTSnifWvhjGcOegRWTXgz8txA2-h5lb6-8e8iPvRhud2y5hwQ6lTdsJ-pMpBsYDMB-pJi7-Y_G2fcvoh2vrlIO-bgypxbqTAGWPpZiJAou9FZ3JvyEbvgO-oIqe-Yf4-3c69h31hqpXmxmi7KL2kKhBVIWOWsx3vYCqjCH0hb9vG7KFuoKKkQdfX8cTI-LjwMwGLxIBS4emHvc9Xpg' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle} numberOfLines={1}>Chat</Text>
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
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'ai' && styles.tabActive]} 
            onPress={() => handleTabSwitch('ai')}
          >
            <Text style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}>AI Assistant</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'admin' && styles.tabActive]} 
            onPress={() => handleTabSwitch('admin')}
          >
            <Text style={[styles.tabText, activeTab === 'admin' && styles.tabTextActive]}>Support Chat</Text>
          </TouchableOpacity>
        </View>

        {/* AI Assistant View */}
        {activeTab === 'ai' && (
          <View style={styles.aiView}>
            <View style={styles.aiHeaderCard}>
              <View style={styles.aiHeaderContent}>
                <View style={styles.aiIconBox}>
                  <Ionicons name="flash" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.aiTitle}>Prestige AI</Text>
                  <Text style={styles.aiSubtitle}>Always active • Instant response</Text>
                </View>
              </View>
              <Text style={styles.aiGreeting}>How can I assist your luxury property management today?</Text>
              
              {/* Decorative Rotating Pattern */}
              <Animated.View style={[styles.aiDecoration, { transform: [{ rotate: spin }] }]}>
                <Ionicons name="sparkles" size={120} color={COLORS.white} style={{ opacity: 0.1 }} />
              </Animated.View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity 
                  key={action.id} 
                  style={styles.quickActionBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMessageText(`I need help with: ${action.title}`);
                  }}
                >
                  <Ionicons name={action.icon as any} size={24} color={COLORS.primary} />
                  <Text style={styles.quickActionText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* AI Conversation Thread */}
            <View style={styles.chatThread}>
              <View style={styles.messageRow}>
                <View style={styles.aiAvatarSmall}>
                  <Ionicons name="flash" size={16} color={COLORS.white} />
                </View>
                <View style={styles.aiBubble}>
                  <Text style={styles.aiBubbleText}>Hello! I can help you book a deep cleaning service or check on your last maintenance request. What's on your mind?</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Admin Chat View */}
        {activeTab === 'admin' && (
          <View style={styles.adminView}>
            {/* Connection Status */}
            <View style={styles.connectionCard}>
              <View style={styles.connectionInfo}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtGIdfXIojd_Q1nb4TtxEARcI6Ab4R5NL8JRtJTRl9ejpmpQUmuTYW4sbHphLTb6_PKs-MxgGqs4pamPhC5XvnNRehNh7X3BilwNXl7KMGBTVCmW9QXzW-xSg7DKazfjolb1b8vfw3-V0vqttRYRgjBOYWi30dFASwS89r9ZaWsa-iUoxDYwm3RlGo3eW1XQD1nICkZr0UmmGWQRS55Mw6rIeeofFjqzrLGyolRO8141MPZ6mX-FH7' }}
                    style={styles.adminAvatar}
                  />
                  <View style={styles.onlineDot} />
                </View>
                <View>
                  <Text style={styles.adminName}>Sarah Chapman</Text>
                  <Text style={styles.adminTitle}>Managing Director</Text>
                </View>
              </View>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.onSurfaceVariant} />
            </View>

            {/* Chat History */}
            <View style={styles.chatHistory}>
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>Yesterday</Text>
              </View>

              {/* Outgoing Message */}
              <View style={styles.outgoingMessage}>
                <View style={styles.outgoingBubble}>
                  <Text style={styles.outgoingText}>Good morning Sarah, could we discuss the pool renovation timeline?</Text>
                </View>
                <View style={styles.messageMeta}>
                  <Text style={styles.metaText}>09:12 AM</Text>
                  <Ionicons name="checkmark-done" size={14} color={COLORS.primary} />
                </View>
              </View>

              {/* Incoming Message */}
              <View style={styles.incomingMessage}>
                <View style={styles.incomingBubble}>
                  <Text style={styles.incomingText}>Absolutely. The team is scheduled to finish the tiling by Friday. Would you like a site visit tomorrow?</Text>
                </View>
                <Text style={[styles.metaText, { alignSelf: 'flex-start', marginLeft: 8 }]}>09:45 AM</Text>
              </View>

              {/* Typing Indicator */}
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <View style={styles.typingAvatar}>
                    <Ionicons name="person" size={16} color={COLORS.onSurfaceVariant} />
                  </View>
                  <View style={styles.typingBubble}>
                    <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
                    <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
                    <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Spacer for floating input */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputBox}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (messageText.trim()) {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMessageText('');
                // In a real app, this would send the message
              }
            }}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  scrollContent: { paddingBottom: 20 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 4, marginHorizontal: PADDING, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.surfaceContainerLowest, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  tabTextActive: { color: COLORS.primary },

  aiView: { paddingHorizontal: PADDING, gap: 16 },
  aiHeaderCard: { backgroundColor: COLORS.primaryContainer, borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' },
  aiHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative', zIndex: 10 },
  aiIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  aiSubtitle: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  aiGreeting: { fontSize: 16, color: COLORS.white, position: 'relative', zIndex: 10 },
  aiDecoration: { position: 'absolute', top: -20, right: -20, zIndex: 1 },
  
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickActionBtn: { width: (SCREEN_WIDTH - (PADDING * 2) - 12) / 2, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12, padding: 16, gap: 8 },
  quickActionText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },

  chatThread: { gap: 12 },
  messageRow: { flexDirection: 'row', gap: 8 },
  aiAvatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiBubble: { backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 16, borderTopLeftRadius: 4, padding: 12, maxWidth: '85%' },
  aiBubbleText: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 24 },

  adminView: { paddingHorizontal: PADDING, gap: 16 },
  connectionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12, padding: 12 },
  connectionInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: { position: 'relative' },
  adminAvatar: { width: 40, height: 40, borderRadius: 20 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.green, borderWidth: 2, borderColor: COLORS.surfaceContainerLow },
  adminName: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  adminTitle: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },

  chatHistory: { gap: 16, paddingBottom: 20 },
  dateSeparator: { alignItems: 'center' },
  dateSeparatorText: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant, backgroundColor: COLORS.surfaceContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  
  outgoingMessage: { alignItems: 'flex-end', gap: 4 },
  outgoingBubble: { backgroundColor: COLORS.primary, borderRadius: 16, borderTopRightRadius: 4, padding: 12, maxWidth: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  outgoingText: { fontSize: 16, color: COLORS.white, lineHeight: 24 },
  messageMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },

  incomingMessage: { alignItems: 'flex-start', gap: 4 },
  incomingBubble: { backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 16, borderTopLeftRadius: 4, padding: 12, maxWidth: '85%' },
  incomingText: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 24 },

  typingIndicator: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  typingAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  typingBubble: { flexDirection: 'row', gap: 4, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.onSurfaceVariant },

  inputContainer: { position: 'absolute', bottom: 80, left: 0, right: 0, paddingHorizontal: PADDING },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(248, 249, 250, 0.95)', borderRadius: 16, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderTopWidth: 1, borderTopColor: COLORS.surfaceContainer },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, fontSize: 16, color: COLORS.onSurface, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { width: 44, height: 44, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
});