import { createClient } from '@supabase/supabase-js';

/* The project endpoint and its publishable key. Both already ship inside the
   client bundle, so exporting them changes nothing about what is public: the
   connection probe below needs them to ask the backend whether it is up. */
export const supabaseUrl = 'https://yqrxiadyqbueubzxwdmq.supabase.co';
export const supabaseAnonKey = 'sb_publishable_6VkWWb3WhZiqqWYA-kn3lQ_t3LOy3r5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
