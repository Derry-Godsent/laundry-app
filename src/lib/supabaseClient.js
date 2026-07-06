import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqrxiadyqbueubzxwdmq.supabase.co';
const supabaseAnonKey = 'sb_publishable_6VkWWb3WhZiqqWYA-kn3lQ_t3LOy3r5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);