/**
 * Clipboard utility with fallback support for different environments
 * 
 * This utility provides a consistent way to copy text to clipboard across
 * different browsers and environments, with graceful fallbacks when the
 * modern Clipboard API is not available.
 */

/**
 * Attempts to copy text to clipboard using the most appropriate method available
 * 
 * @param text - The text to copy to clipboard
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Method 1: Try modern Clipboard API (most browsers, requires HTTPS)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Method 2: Try legacy execCommand (older browsers, works in HTTP)
    if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }

    // Method 3: Fallback - return false to indicate clipboard is not available
    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Copies text to clipboard and returns a result object with success status and message
 * 
 * @param text - The text to copy to clipboard
 * @returns Promise<{success: boolean, message: string}>
 */
export const copyToClipboardWithResult = async (text: string): Promise<{success: boolean, message: string}> => {
  const success = await copyToClipboard(text);
  
  if (success) {
    return {
      success: true,
      message: 'Text copied to clipboard successfully!'
    };
  } else {
    return {
      success: false,
      message: 'Unable to copy to clipboard. Please copy manually.'
    };
  }
};

/**
 * Checks if the clipboard API is available in the current environment
 * 
 * @returns boolean - True if clipboard is available, false otherwise
 */
export const isClipboardAvailable = (): boolean => {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
};

/**
 * Gets the best available clipboard method for the current environment
 * 
 * @returns string - Description of the available clipboard method
 */
export const getClipboardMethod = (): string => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return 'Modern Clipboard API';
  } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
    return 'Legacy execCommand';
  } else {
    return 'No clipboard support available';
  }
};
