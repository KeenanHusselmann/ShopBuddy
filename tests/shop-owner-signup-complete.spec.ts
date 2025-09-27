import { test, expect } from '@playwright/test';

test.describe('Shop Owner Complete Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full shop owner signup process', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now();
    const testEmail = `test.shop.owner.${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    const firstName = 'Test';
    const lastName = 'ShopOwner';
    
    // Navigate to home page and click shop owner signup
    const signUpButton = page.locator('button:has-text("Sign Up")').first();
    await signUpButton.click();
    
    // Wait for navigation to signup page
    await page.waitForURL('**/shop-owner-auth?mode=signup');
    
    // Verify we're on the signup page
    await expect(page.locator('text=Create Shop Owner Account')).toBeVisible();
    
    // Fill out the signup form
    await page.fill('input[placeholder="Enter first name"]', firstName);
    await page.fill('input[placeholder="Enter last name"]', lastName);
    await page.fill('input[placeholder="owner@yourshop.com"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[type="password"]', testPassword);
    
    // Verify all fields are filled correctly
    await expect(page.locator('input[placeholder="Enter first name"]')).toHaveValue(firstName);
    await expect(page.locator('input[placeholder="Enter last name"]')).toHaveValue(lastName);
    await expect(page.locator('input[placeholder="owner@yourshop.com"]')).toHaveValue(testEmail);
    
    // Submit the form
    const submitButton = page.locator('button:has-text("Create Shop Owner Account")');
    await submitButton.click();
    
    // Wait for the signup process to complete
    // This might take a moment as it involves API calls
    await page.waitForTimeout(3000);
    
    // Check for success message
    const successMessage = page.locator('text=Account Created Successfully!');
    await expect(successMessage).toBeVisible();
    
    // Verify the form was reset
    await expect(page.locator('input[placeholder="Enter first name"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="Enter last name"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="owner@yourshop.com"]')).toHaveValue('');
    
    // Verify we're now in signin mode
    await expect(page.locator('text=Shop Owner Sign In')).toBeVisible();
  });

  test('should handle password mismatch validation', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Fill out the form with mismatched passwords
    await page.fill('input[placeholder="Enter first name"]', 'John');
    await page.fill('input[placeholder="Enter last name"]', 'Doe');
    await page.fill('input[placeholder="owner@yourshop.com"]', 'john.doe@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.fill('input[type="password"]', 'DifferentPassword123');
    
    // Submit the form
    const submitButton = page.locator('button:has-text("Create Shop Owner Account")');
    await submitButton.click();
    
    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Check for error message about password mismatch
    const errorMessage = page.locator('text=Passwords do not match');
    await expect(errorMessage).toBeVisible();
  });

  test('should handle short password validation', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Fill out the form with short password
    await page.fill('input[placeholder="Enter first name"]', 'John');
    await page.fill('input[placeholder="Enter last name"]', 'Doe');
    await page.fill('input[placeholder="owner@yourshop.com"]', 'john.doe@example.com');
    await page.fill('input[type="password"]', '123');
    await page.fill('input[type="password"]', '123');
    
    // Submit the form
    const submitButton = page.locator('button:has-text("Create Shop Owner Account")');
    await submitButton.click();
    
    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Check for error message about short password
    const errorMessage = page.locator('text=Password must be at least 6 characters long');
    await expect(errorMessage).toBeVisible();
  });

  test('should test form field interactions and focus states', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation through form fields
    const firstNameField = page.locator('input[placeholder="Enter first name"]');
    const lastNameField = page.locator('input[placeholder="Enter last name"]');
    const emailField = page.locator('input[placeholder="owner@yourshop.com"]');
    const passwordField = page.locator('input[type="password"]').first();
    const confirmPasswordField = page.locator('input[type="password"]').nth(1);
    
    // Focus on first name field
    await firstNameField.focus();
    await expect(firstNameField).toBeFocused();
    
    // Tab to next field
    await page.keyboard.press('Tab');
    await expect(lastNameField).toBeFocused();
    
    // Tab to email field
    await page.keyboard.press('Tab');
    await expect(emailField).toBeFocused();
    
    // Tab to password field
    await page.keyboard.press('Tab');
    await expect(passwordField).toBeFocused();
    
    // Tab to confirm password field
    await page.keyboard.press('Tab');
    await expect(confirmPasswordField).toBeFocused();
  });

  test('should test responsive design on different viewport sizes', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Verify form is still accessible on mobile
    await expect(page.locator('text=Create Shop Owner Account')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter first name"]')).toBeVisible();
    
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify form is still accessible on tablet
    await expect(page.locator('text=Create Shop Owner Account')).toBeVisible();
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify form is still accessible on desktop
    await expect(page.locator('text=Create Shop Owner Account')).toBeVisible();
  });

  test('should test accessibility features', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Check if form fields have proper labels
    const firstNameLabel = page.locator('label[for="first_name"]');
    const lastNameLabel = page.locator('label[for="last_name"]');
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    const confirmPasswordLabel = page.locator('label[for="confirm_password"]');
    
    await expect(firstNameLabel).toBeVisible();
    await expect(lastNameLabel).toBeVisible();
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
    await expect(confirmPasswordLabel).toBeVisible();
    
    // Check if labels are properly associated with inputs
    const firstNameField = page.locator('#first_name');
    const lastNameField = page.locator('#last_name');
    const emailField = page.locator('#email');
    const passwordField = page.locator('#password');
    const confirmPasswordField = page.locator('#confirm_password');
    
    await expect(firstNameField).toBeVisible();
    await expect(lastNameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(confirmPasswordField).toBeVisible();
  });

  test('should test error handling and recovery', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/shop-owner-auth?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Fill out form with valid data
    await page.fill('input[placeholder="Enter first name"]', 'John');
    await page.fill('input[placeholder="Enter last name"]', 'Doe');
    await page.fill('input[placeholder="owner@yourshop.com"]', 'john.doe@example.com');
    await page.fill('input[type="password"]', 'ValidPassword123');
    await page.fill('input[type="password"]', 'ValidPassword123');
    
    // Submit form
    const submitButton = page.locator('button:has-text("Create Shop Owner Account")');
    await submitButton.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check if we get a response (either success or error)
    const successMessage = page.locator('text=Account Created Successfully!');
    const errorMessage = page.locator('[role="alert"]'); // Toast messages
    
    // One of these should be visible
    const hasSuccess = await successMessage.isVisible();
    const hasError = await errorMessage.isVisible();
    
    expect(hasSuccess || hasError).toBeTruthy();
  });
});
