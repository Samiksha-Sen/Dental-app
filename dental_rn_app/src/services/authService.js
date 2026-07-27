import { supabase } from './supabaseClient';

/**
 * Authentication Service for Dental AI
 * Implements complete authentication with proper error handling and persistent sessions.
 */

export async function signUp(email, password, fullName = '') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { user: null, session: null, error: handleAuthError(error) };
    }

    // Automatically create a profile row if user was created
    if (data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName || data.user.email?.split('@')[0] || 'Clinician',
          email: data.user.email,
          created_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn('Profile upsert warning:', profileErr.message);
      }
    }

    return { user: data?.user || null, session: data?.session || null, error: null };
  } catch (err) {
    return { user: null, session: null, error: handleAuthError(err) };
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: handleAuthError(error) };
    }

    return { user: data?.user || null, session: data?.session || null, error: null };
  } catch (err) {
    return { user: null, session: null, error: handleAuthError(err) };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: handleAuthError(error) };
    }
    return { error: null };
  } catch (err) {
    return { error: handleAuthError(err) };
  }
}

export async function verifyOtp(email, token) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) {
      return { user: null, session: null, error: handleAuthError(error) };
    }

    return { user: data?.user || null, session: data?.session || null, error: null };
  } catch (err) {
    return { user: null, session: null, error: handleAuthError(err) };
  }
}

export async function resendOtp(email) {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { data: null, error: handleAuthError(error) };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleAuthError(err) };
  }
}

export async function forgotPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { data: null, error: handleAuthError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleAuthError(err) };
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { session: null, error: handleAuthError(error) };
    }
    return { session: data?.session || null, error: null };
  } catch (err) {
    return { session: null, error: handleAuthError(err) };
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return { user: null, error: handleAuthError(error) };
    }
    return { user: data?.user || null, error: null };
  } catch (err) {
    return { user: null, error: handleAuthError(err) };
  }
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return data;
}

/**
 * Categorizes and formats auth/network/session errors
 */
function handleAuthError(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
    return new Error('Network error: Unable to connect to Supabase authentication server.');
  }
  if (msg.includes('Invalid login credentials')) {
    return new Error('Authentication error: Invalid email or password.');
  }
  if (msg.includes('JWT expired') || msg.includes('session expired')) {
    return new Error('Session expired: Please log in again to continue.');
  }
  return error instanceof Error ? error : new Error(msg);
}
