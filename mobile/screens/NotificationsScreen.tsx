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
const PADDING = 20;

const COLORS = {
  primary: '#003ec7',
  primaryContainer: '#0052ff',
  secondaryContainer: '#fe6b00',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
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
};

const FILTERS = ['All', 'Services', 'Promos', 'Security'];

const NOTIFICATIONS = [
  {
    id: '1',
    category: 'Services',
    title: 'Laundry En Route',
    time: 'Just now',
    description: 'Kofi Mensah is 5 mins away. Have your items ready at the door.',
    actionText: 'Track driver',
    isUnread: true,
    iconName: 'car-sport',
  },
  {
    id: '2',
    category: 'Promos',
    title: 'Special Weekend Offer!',
    time: '2 hours ago',
    description: '15% off all fumigation services booked this weekend. Code: WEEKEND15.',
    isUnread: false,
    iconName: 'pricetag',
  },
  {
    id: '3',
    category: 'Security',
    title: 'Security Update',
    time: 'Yesterday',
    description: 'New login detected from Accra, Ghana. If this wasn\'t you, secure your account immediately.',
    actionText: 'Review Activity',
    isUnread: false,
    iconName: 'shield-checkmark',
  },
];

export default function NotificationsScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState('All');

  const handleFilterPress = async (filter: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const filteredNotifications = activeFilter === 'All' 
    ? NOTIFICATIONS 
    : NOTIFICATIONS.filter(n => n.category === activeFilter);

  const getIconColor = (category: string) => {
    if (category === 'Services') return COLORS.primary;
    if (category === 'Promos') return COLORS.secondaryContainer;
    if (category === 'Security') return COLORS.error;
    return COLORS.primary;
  };

  const getIconBg = (category: string) => {
    if (category === 'Services') return 'rgba(0, 62, 199, 0.1)';
    if (category === 'Promos') return COLORS.secondaryContainer;
    if (category === 'Security') return COLORS.errorContainer;
    return 'rgba(0, 62, 199, 0.1)';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.actionsRow}>
          <Text style={styles.inboxTitle}>Inbox</Text>
          <TouchableOpacity 
            style={styles.markAllBtn}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => handleFilterPress(filter)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listContainer}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="mail-outline" size={48} color={COLORS.onSurfaceVariant} />
              </View>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptySubtitle}>You have no new notifications.</Text>
            </View>
          ) : (
            filteredNotifications.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.notificationCard, 
                  item.isUnread && styles.notificationCardUnread
                ]}
                activeOpacity={0.7}
              >
                {item.isUnread && <View style={styles.unreadIndicator} />}
                
                <View style={[styles.iconBox, { backgroundColor: getIconBg(item.category) }]}>
                  <Ionicons 
                    name={item.iconName as any} 
                    size={24} 
                    color={item.category === 'Promos' ? COLORS.white : getIconColor(item.category)} 
                  />
                  {item.isUnread && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.notificationTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.notificationDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  
                  {item.actionText && (
                    <TouchableOpacity 
                      style={[
                        styles.actionBtn, 
                        item.category === 'Security' && styles.actionBtnError
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (item.category === 'Services') navigation.navigate('Tracking');
                      }}
                    >
                      <Text style={item.category === 'Security' ? styles.actionBtnTextError : styles.actionBtnText}>
                        {item.actionText}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
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
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  
  scrollView: { flex: 1 },
  
  actionsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PADDING, marginTop: 24, marginBottom: 16,
  },
  inboxTitle: { fontSize: 28, fontWeight: '700', color: COLORS.onBackground },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0, 62, 199, 0.1)', borderRadius: 20 },
  markAllText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  filtersContainer: { paddingHorizontal: PADDING, gap: 8, paddingBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surfaceContainer },
  filterChipActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  filterText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  filterTextActive: { color: COLORS.white },

  listContainer: { paddingHorizontal: PADDING, gap: 12 },
  notificationCard: {
    flexDirection: 'row', gap: 16, padding: 16, borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  notificationCardUnread: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  unreadIndicator: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
    backgroundColor: COLORS.primary, borderTopLeftRadius: 24, borderBottomLeftRadius: 24,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
  },
  unreadDot: {
    position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.surfaceContainerLow,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8,
  },
  notificationContent: { flex: 1, gap: 8 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  notificationTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onBackground, flex: 1 },
  notificationTime: { fontSize: 12, fontWeight: '500', color: COLORS.onSurfaceVariant },
  notificationDescription: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 22 },
  
  actionBtn: { alignSelf: 'flex-start', marginTop: 4 },
  actionBtnError: { backgroundColor: COLORS.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  actionBtnTextError: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: COLORS.onBackground },
  emptySubtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, textAlign: 'center' },
});