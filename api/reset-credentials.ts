// api/reset-credentials.ts
import { createClient } from '@supabase/supabase-js';

// This line tells TypeScript that 'process' exists (fixes the red error)
declare const process: any;

export default async function handler(req: any, res: any) {
  // 1. Verify request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Verify Admin Token
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.ADMIN_API_TOKEN;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, newEmail, newPassword } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // 3. Initialize Supabase Admin Client (Service Role)
    // This key allows us to modify other users' auth data
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 4. Prepare updates
    const updates: Record<string, any> = {};
    if (newEmail) updates.email = newEmail;
    if (newPassword) updates.password = newPassword;

    // 5. Apply updates to Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updates
    );

    if (authError) throw authError;

    return res.status(200).json({ success: true, message: 'Credentials updated' });
  } catch (err: any) {
    console.error('Reset credentials error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}