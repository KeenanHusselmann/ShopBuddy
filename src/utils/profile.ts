import { supabase } from "@/integrations/supabase/client";

/**
 * Profile utility functions for consistent profile management
 */

export interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  shop_id?: string;
  phone?: string | null;
  customer_type?: string;
}

/**
 * Creates or updates a user profile, handling cases where the profile
 * might already exist due to database triggers
 * 
 * @param profileData - The profile data to create/update
 * @returns Promise<{success: boolean, error?: string}>
 */
export const createOrUpdateProfile = async (profileData: ProfileData): Promise<{success: boolean, error?: string}> => {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileData.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking existing profile:", checkError);
      return { success: false, error: checkError.message };
    }

    let profileError = null;
    
    if (existingProfile) {
      // Profile already exists, update it
      console.log("Profile already exists, updating with new data");
      
      const updateData: Partial<ProfileData> = {
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role,
        updated_at: new Date().toISOString()
      };

      // Add optional fields if they exist
      if (profileData.shop_id !== undefined) updateData.shop_id = profileData.shop_id;
      if (profileData.phone !== undefined) updateData.phone = profileData.phone;
      if (profileData.customer_type !== undefined) updateData.customer_type = profileData.customer_type;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileData.id);
      
      profileError = updateError;
    } else {
      // Profile doesn't exist, create it
      console.log("Creating new profile");
      
      const insertData: any = {
        id: profileData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add optional fields if they exist
      if (profileData.shop_id !== undefined) insertData.shop_id = profileData.shop_id;
      if (profileData.phone !== undefined) insertData.phone = profileData.phone;
      if (profileData.customer_type !== undefined) insertData.customer_type = profileData.customer_type;

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(insertData);
      
      profileError = insertError;
    }

    if (profileError) {
      console.error("Profile creation/update error:", profileError);
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in createOrUpdateProfile:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Gets a user profile by ID
 * 
 * @param userId - The user ID to look up
 * @returns Promise<{data?: any, error?: string}>
 */
export const getProfile = async (userId: string): Promise<{data?: any, error?: string}> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error("Error getting profile:", error);
    return { 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Checks if a profile exists for a given user ID
 * 
 * @param userId - The user ID to check
 * @returns Promise<boolean>
 */
export const profileExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking profile existence:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking profile existence:", error);
    return false;
  }
};
