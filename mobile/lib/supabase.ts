import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR ACTUAL CREDENTIALS FROM SUPABASE DASHBOARD
const supabaseUrl = 'https://yqrxiadyqbueubzxwdmq.supabase.co';
const supabaseAnonKey = 'sb_publishable_6VkWWb3WhZiqqWYA-kn3lQ_t3LOy3r5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});