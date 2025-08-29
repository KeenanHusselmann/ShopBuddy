-- Fix Customer Password Issue
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's check the current state
SELECT 
    'Current State Check' as check_type,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'chridonpa@gmail.com';

-- The issue might be that the customer account was created but the password wasn't properly set
-- Let's check if we need to reset the password or if there's another issue

-- Option 1: Check if the user needs to reset their password
SELECT 
    'Password Reset Check' as check_type,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'User needs to confirm email first'
        WHEN email_confirmed_at IS NOT NULL THEN 'Email confirmed, password issue likely'
        ELSE 'Unknown status'
    END as status,
    'If email is not confirmed, user needs to check email for confirmation link' as action;

-- Option 2: Check if the invitation flow completed properly
SELECT 
    'Invitation Flow Check' as check_type,
    status,
    accepted_at,
    accepted_by,
    CASE 
        WHEN status = 'accepted' AND accepted_at IS NOT NULL THEN 'Invitation accepted properly'
        WHEN status = 'pending' THEN 'Invitation still pending - user needs to complete flow'
        ELSE 'Invitation status unclear'
    END as invitation_status
FROM public.shop_customer_invitations 
WHERE email = 'chridonpa@gmail.com';

-- Option 3: Manual password reset (if needed)
-- Note: This would require the user to go through password reset flow
SELECT 
    'Manual Password Reset' as check_type,
    'User may need to use "Forgot Password" option to reset their password' as recommendation,
    'This will send a password reset email to chridonpa@gmail.com' as action;

-- Final diagnostic
SELECT 
    'Diagnostic Complete' as status,
    'Check the results above to identify the specific issue' as next_step;
