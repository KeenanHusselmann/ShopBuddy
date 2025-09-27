import { test, expect } from '@playwright/test';

test.describe('Add Products Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Add a global delay to make tests execute slowly
    page.setDefaultTimeout(60000); // 60 seconds timeout
    page.setDefaultNavigationTimeout(60000);
  });

  test('should add one product with slow execution', async ({ page }) => {
    // Navigate to shop owner auth page
    await page.goto('/shop-owner-auth?mode=signin');
    await page.waitForLoadState('networkidle');
    
    // Wait 2 seconds before proceeding
    await page.waitForTimeout(2000);
    
    // Fill in login credentials (you'll need to update these with real test credentials)
    const emailField = page.locator('input[placeholder="owner@yourshop.com"]');
    const passwordField = page.locator('input[type="password"]').first();
    
    await emailField.fill('requellehusselmann@gmail.com');
    await page.waitForTimeout(1000); // Wait 1 second between fields
    
    await passwordField.fill('Password3');
    await page.waitForTimeout(1000);
    
    // Click sign in button
    const signInButton = page.locator('button:has-text("Sign In")');
    await signInButton.click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/shop-owner-dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait 3 seconds on dashboard
    
    // Navigate to products page using sidebar
    const productsLink = page.locator('a[href="/shop-owner-products"]');
    await productsLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait 2 seconds
    
    // Verify we're on the products page
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
    await page.waitForTimeout(1000);
    
         // Add first product
     await addProduct(page, {
       name: 'Earrings',
       description: 'Handmade resin and wood earrings. Perfectly crafted for anyone',
       price: '80.00',
       costPrice: '18.00',
       category: 'Jewellery',
       supplier: 'Kelly\'s Jewellery designs',
       sku: 'EARRINGS-001',
       stockQuantity: '5',
       minStockLevel: '2'
     });
    
         // Final wait
     await page.waitForTimeout(2000);
     
     // Verify product was added by checking the products list
     await expect(page.locator('text=Earrings')).toBeVisible();
  });

  test('should handle product form validation with slow execution', async ({ page }) => {
    // Navigate to products page
    await page.goto('/shop-owner-products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click add product button
    const addProductButton = page.locator('button:has-text("Add Product")');
    await addProductButton.click();
    await page.waitForTimeout(1000);
    
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Add Product")').last();
    await submitButton.click();
    await page.waitForTimeout(2000);
    
    // Verify validation errors are shown
    await expect(page.locator('text=Product name is required')).toBeVisible();
    await page.waitForTimeout(1000);
    
         // Fill in only required fields one by one with delays
     const nameField = page.locator('input[placeholder="Enter product name"]');
     await nameField.fill('Test Product');
     await page.waitForTimeout(1000);
     
     const priceField = page.locator('input[placeholder="0.00"]').first();
     await priceField.fill('19.99');
     await page.waitForTimeout(1000);
     
     const costPriceField = page.locator('input[placeholder="0.00"]').nth(1);
     await costPriceField.fill('15.00');
     await page.waitForTimeout(1000);
     
     const skuField = page.locator('input[placeholder="Enter SKU"]');
     await skuField.fill('TEST-001');
     await page.waitForTimeout(1000);
     
     const stockField = page.locator('input[placeholder="Enter stock quantity"]');
     await stockField.fill('50');
     await page.waitForTimeout(1000);
     
     const minStockField = page.locator('input[placeholder="Enter minimum stock level"]');
     await minStockField.fill('10');
     await page.waitForTimeout(1000);
     
     const categoryField = page.locator('select[name="category_id"]');
     await categoryField.selectOption('Beverages');
     await page.waitForTimeout(1000);
    
    // Now submit the form
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    // Verify product was added
    await expect(page.locator('text=Test Product')).toBeVisible();
  });

  test('should edit existing product with slow execution', async ({ page }) => {
    // Navigate to products page
    await page.goto('/shop-owner-products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find and click edit button for first product
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(2000);
    
    // Wait for edit form to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Update product details with delays
    const nameField = page.locator('input[placeholder="Enter product name"]');
    await nameField.clear();
    await page.waitForTimeout(1000);
    await nameField.fill('Updated Premium Coffee Beans');
    await page.waitForTimeout(1000);
    
    const priceField = page.locator('input[placeholder="0.00"]');
    await priceField.clear();
    await page.waitForTimeout(1000);
    await priceField.fill('29.99');
    await page.waitForTimeout(1000);
    
    const descriptionField = page.locator('textarea[placeholder="Enter product description"]');
    await descriptionField.clear();
    await page.waitForTimeout(1000);
    await descriptionField.fill('Updated description for premium coffee beans');
    await page.waitForTimeout(1000);
    
    // Save changes
    const saveButton = page.locator('button:has-text("Update Product")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    // Verify product was updated
    await expect(page.locator('text=Updated Premium Coffee Beans')).toBeVisible();
    await expect(page.locator('text=$29.99')).toBeVisible();
  });

  test('should delete product with slow execution', async ({ page }) => {
    // Navigate to products page
    await page.goto('/shop-owner-products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find and click delete button for a product
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    await page.waitForTimeout(2000);
    
    // Confirm deletion in modal/dialog
    const confirmButton = page.locator('button:has-text("Confirm")');
    await confirmButton.click();
    await page.waitForTimeout(3000);
    
    // Verify product was deleted (this will depend on your UI implementation)
    // You might need to adjust this based on how your delete confirmation works
  });
});

// Helper function to add a product
async function addProduct(page: any, productData: {
  name: string;
  description: string;
  price: string;
  costPrice: string;
  category: string;
  supplier: string;
  sku: string;
  stockQuantity: string;
  minStockLevel: string;
}) {
  // Click add product button
  const addProductButton = page.locator('button:has-text("Add Product")');
  await addProductButton.click();
  await page.waitForTimeout(2000);
  
  // Wait for form to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Fill in product name
  const nameField = page.locator('input[placeholder="Enter product name"]');
  await nameField.fill(productData.name);
  await page.waitForTimeout(1000);
  
  // Fill in description
  const descriptionField = page.locator('textarea[placeholder="Enter product description"]');
  await descriptionField.fill(productData.description);
  await page.waitForTimeout(1000);
  
  // Fill in price
  const priceField = page.locator('input[placeholder="0.00"]').first();
  await priceField.fill(productData.price);
  await page.waitForTimeout(1000);
  
  // Fill in cost price
  const costPriceField = page.locator('input[placeholder="0.00"]').nth(1);
  await costPriceField.fill(productData.costPrice);
  await page.waitForTimeout(1000);
  
  // Fill in SKU
  const skuField = page.locator('input[placeholder="Enter SKU"]');
  await skuField.fill(productData.sku);
  await page.waitForTimeout(1000);
  
  // Fill in stock quantity
  const stockField = page.locator('input[placeholder="Enter stock quantity"]');
  await stockField.fill(productData.stockQuantity);
  await page.waitForTimeout(1000);
  
  // Fill in minimum stock level
  const minStockField = page.locator('input[placeholder="Enter minimum stock level"]');
  await minStockField.fill(productData.minStockLevel);
  await page.waitForTimeout(1000);
  
  // Select category from dropdown
  const categoryField = page.locator('select[name="category_id"]');
  await categoryField.selectOption(productData.category);
  await page.waitForTimeout(1000);
  
  // Select supplier from dropdown
  const supplierField = page.locator('select[name="supplier_id"]');
  await supplierField.selectOption(productData.supplier);
  await page.waitForTimeout(1000);
  
  // Submit the form
  const submitButton = page.locator('button:has-text("Add Product")').last();
  await submitButton.click();
  await page.waitForTimeout(3000);
  
  // Wait for success message or redirect
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}
