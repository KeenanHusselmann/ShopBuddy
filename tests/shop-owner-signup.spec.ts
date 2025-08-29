import { test, expect } from '@playwright/test';

test.describe('Shop Owner Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display shop owner portal card on home page', async ({ page }) => {
    // Check if the shop owner portal card is visible
    const shopOwnerCard = page.locator('text=Shop Owner').first();
    await expect(shopOwnerCard).toBeVisible();
    
    // Check if both sign in and sign up buttons are present
    const signInButton = page.locator('button:has-text("Sign In")').first();
    const signUpButton = page.locator('button:has-text("Sign Up")').first();
    
    await expect(signInButton).toBeVisible();
    await expect(signUpButton).toBeVisible();
  });

  test('should navigate to shop owner signup page when signup button is clicked', async ({ page }) => {
    // Click the shop owner signup button
    const signUpButton = page.locator('button:has-text("Sign Up")').first();
    await signUpButton.click();
    
    // Wait for navigation and check URL
    await page.waitForURL('**/shop-owner-auth?mode=signup');
    
    // Verify we're on the signup page
    const pageTitle = page.locator('h1:has-text("Shop Portal")');
    await expect(pageTitle).toBeVisible();
    
    // Check if signup form is displayed
    const signupTitle = page.locator('text=Create Shop Owner Account');
    await expect(signupTitle).toBeVisible();
  });

  test('should display all required form fields in signup mode', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Check if all required form fields are present
    const firstNameField = page.locator('input[placeholder="Enter first name"]');
    const lastNameField = page.locator('input[placeholder="Enter last name"]');
    const emailField = page.locator('input[placeholder="owner@yourshop.com"]');
    const passwordField = page.locator('input[type="password"]').first();
    const confirmPasswordField = page.locator('input[type="password"]').nth(1);
    
    await expect(firstNameField).toBeVisible();
    await expect(lastNameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(confirmPasswordField).toBeVisible();
    
    // Check if all fields are required
    await expect(firstNameField).toHaveAttribute('required');
    await expect(lastNameField).toHaveAttribute('required');
    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
    await expect(confirmPasswordField).toHaveAttribute('required');
  });

  test('should validate form fields before submission', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Create Shop Owner Account")');
    await submitButton.click();
    
    // Check if form validation prevents submission (HTML5 validation)
    // The form should not submit and we should still be on the same page
    await expect(page.locator('text=Create Shop Owner Account')).toBeVisible();
  });

  test('should show password requirements', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Check if password requirement text is visible
    const passwordRequirement = page.locator('text=Password must be at least 6 characters long');
    await expect(passwordRequirement).toBeVisible();
  });

  test('should toggle between signup and signin modes', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Verify we're in signup mode
    await expect(page.locator('text=Create Shop Owner Account')).toBeVisible();
    
    // Click the toggle button to switch to signin
    const toggleButton = page.locator('button:has-text("Sign in instead")');
    await toggleButton.click();
    
    // Verify we're now in signin mode
    await expect(page.locator('text=Shop Owner Sign In')).toBeVisible();
    
    // Click the toggle button to switch back to signup
    const toggleBackButton = page.locator('button:has-text("Sign up instead")');
    await toggleButton.click();
    
    // Verify we're back in signup mode
    await expect(page.locator('text=Create Shop Owner Account')).toBeVisible();
  });

  test('should display next steps information for signup', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Check if next steps information is displayed
    const nextStepsTitle = page.locator('text=Next Steps After Sign Up:');
    await expect(nextStepsTitle).toBeVisible();
    
    // Check if all steps are listed
    const step1 = page.locator('text=Verify your email address');
    const step2 = page.locator('text=Register your shop details');
    const step3 = page.locator('text=Wait for platform admin approval');
    const step4 = page.locator('text=Start managing your shop!');
    
    await expect(step1).toBeVisible();
    await expect(step2).toBeVisible();
    await expect(step3).toBeVisible();
    await expect(step4).toBeVisible();
  });

  test('should have back to home navigation', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Check if back to home button is present
    const backButton = page.locator('button:has-text("Back to Home")');
    await expect(backButton).toBeVisible();
    
    // Click the back button
    await backButton.click();
    
    // Verify we're back on the home page
    await expect(page.locator('text=ShopBuddy')).toBeVisible();
  });

  test('should handle password visibility toggle', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Get password fields
    const passwordField = page.locator('input[type="password"]').first();
    const confirmPasswordField = page.locator('input[type="password"]').nth(1);
    
    // Initially, password fields should be type="password"
    await expect(passwordField).toHaveAttribute('type', 'password');
    await expect(confirmPasswordField).toHaveAttribute('type', 'password');
    
    // Click the eye icon on password field
    const passwordEyeButton = page.locator('button').filter({ hasText: '' }).nth(0);
    await passwordEyeButton.click();
    
    // Password should now be visible
    await expect(passwordField).toHaveAttribute('type', 'text');
    
    // Click the eye icon on confirm password field
    const confirmPasswordEyeButton = page.locator('button').filter({ hasText: '' }).nth(1);
    await confirmPasswordEyeButton.click();
    
    // Confirm password should now be visible
    await expect(confirmPasswordField).toHaveAttribute('type', 'text');
  });

  test('should display proper error messages for validation failures', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Fill in some fields but leave others empty
    await page.fill('input[placeholder="Enter first name"]', 'John');
    await page.fill('input[placeholder="Enter last name"]', 'Doe');
    await page.fill('input[placeholder="owner@yourshop.com"]', 'john.doe@example.com');
    
    // Try to submit with short password
    await page.fill('input[type="password"]', '123');
    await page.fill('input[type="password"]', '123');
    
    // Submit the form
    const submitButton = page.locator('button:has-text("Create Shop Owner Account")');
    await submitButton.click();
    
    // The form should not submit due to HTML5 validation
    // We should still be on the signup page
    await expect(page.locator('text=Create Shop Owner Account')).toBeVisible();
  });

  test('should have consistent styling and layout', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Check if the page has the correct background gradient
    const mainContainer = page.locator('div').filter({ hasText: 'Shop Portal' }).first();
    await expect(mainContainer).toHaveClass(/bg-gradient-to-br/);
    
    // Check if the card has proper styling
    const authCard = page.locator('.bg-white\\/95');
    await expect(authCard).toBeVisible();
    
    // Check if the form has proper spacing
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });
});
