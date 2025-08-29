/**
 * Generates a UUID v4 string with fallback support for older browsers
 * 
 * This function first tries to use the modern `crypto.randomUUID()` API if available,
 * and falls back to a custom implementation for older browsers that don't support it.
 * 
 * @returns A valid UUID v4 string
 */
export const generateUUID = (): string => {
  // Try to use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  // This generates a UUID v4 compliant string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generates a shorter unique identifier (8 characters)
 * Useful for cases where a full UUID is not needed
 * 
 * @returns A 8-character unique string
 */
export const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * Generates a unique token for invitations or other purposes
 * Combines timestamp with random string for uniqueness
 * 
 * @returns A unique token string
 */
export const generateInvitationToken = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};
