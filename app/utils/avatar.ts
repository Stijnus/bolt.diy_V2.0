import type { User } from '@supabase/supabase-js';

/**
 * Get avatar URL from Supabase user data, trying multiple sources
 * Different OAuth providers store avatar data in different places
 */
export function getAvatarUrl(user: User, fallbackColor: string = '8b5cf6', useProxy: boolean = false): string {
  let avatarUrl: string | null = null;
  
  // Try user_metadata first (GitHub usually stores it here)
  if (user.user_metadata?.avatar_url) {
    avatarUrl = user.user_metadata.avatar_url;
  }
  // Try identities array (Google might store it here)
  else if (user.identities) {
    const googleIdentity = user.identities.find((identity) => identity.provider === 'google');
    if (googleIdentity?.identity_data?.picture) {
      avatarUrl = googleIdentity.identity_data.picture;
    } else {
      const githubIdentity = user.identities.find((identity) => identity.provider === 'github');
      if (githubIdentity?.identity_data?.avatar_url) {
        avatarUrl = githubIdentity.identity_data.avatar_url;
      }
    }
  }
  // Try raw user_metadata picture field (some providers use this)
  else if (user.user_metadata?.picture) {
    avatarUrl = user.user_metadata.picture;
  }
  // Try user_metadata photo field (alternative field some providers might use)
  else if (user.user_metadata?.photo) {
    avatarUrl = user.user_metadata.photo;
  }
  
  // If we found an avatar URL and proxy is requested, wrap it
  if (avatarUrl && useProxy) {
    return `/api/avatar?url=${encodeURIComponent(avatarUrl)}`;
  } else if (avatarUrl) {
    return avatarUrl;
  }
  
  // Fallback to generated avatar
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=${fallbackColor}&color=fff&bold=true`;
  
  return useProxy ? `/api/avatar?url=${encodeURIComponent(fallbackUrl)}` : fallbackUrl;
}