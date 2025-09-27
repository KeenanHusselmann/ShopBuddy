# Slow Execution Playwright Tests

This directory contains Playwright tests designed to execute slowly for testing purposes. These tests are useful for:

- **Demo purposes** - Showing stakeholders how the application works
- **Debugging** - Observing each step of the test execution
- **Performance testing** - Simulating slow user interactions
- **Training** - Teaching team members how the application functions

## Test Files

### `add-products.spec.ts`
A comprehensive test suite for adding products to the shop system. This test:

- **Logs in** as a shop owner
- **Navigates** through the dashboard using the sidebar
- **Adds one product** with realistic data
- **Tests form validation** with slow execution
- **Edits existing products** with delays
- **Tests product deletion** functionality

## Configuration Files

### `playwright.slow.config.ts`
A dedicated configuration file for slow execution tests that:

- **Disables parallel execution** (`fullyParallel: false`)
- **Uses single worker** (`workers: 1`)
- **Adds 1000ms delays** between operations (`slowMo: 1000`)
- **Increases timeouts** for slow execution
- **Forces single browser** (Chromium only)

## Running the Tests

### 1. Using the Slow Configuration
```bash
# Run with slow configuration
npx playwright test --config=playwright.slow.config.ts

# Run specific test file with slow configuration
npx playwright test add-products.spec.ts --config=playwright.slow.config.ts

# Run with headed browser (visible)
npx playwright test --config=playwright.slow.config.ts --headed
```

### 2. Using the Default Configuration
```bash
# Run with default configuration (still slow due to built-in delays)
npx playwright test add-products.spec.ts

# Run with headed browser
npx playwright test add-products.spec.ts --headed
```

### 3. Debug Mode
```bash
# Run in debug mode with slow execution
npx playwright test add-products.spec.ts --debug --config=playwright.slow.config.ts
```

## Test Execution Speed

The tests are designed to execute slowly with the following delays:

- **2-3 seconds** between major navigation steps
- **1 second** between form field inputs
- **3 seconds** between adding different products
- **1-2 seconds** for form submissions and page loads
- **Global slowMo** of 1000ms for all Playwright operations

**Total estimated execution time**: 1-2 minutes for the complete test suite

## Test Data

The tests add the following product:

1. **Earrings** - $80.00 (Jewellery) - Cost: $18.00, Supplier: Kelly's Jewellery designs

## Prerequisites

Before running the tests, ensure:

1. **Development server** is running (`npm run dev`)
2. **Test credentials** are available (update the test file with real credentials)
3. **Database** is properly configured
4. **All dependencies** are installed (`npm install`)

## Customizing Test Speed

To adjust the execution speed, modify:

### In the test file:
```typescript
// Increase/decrease delays between operations
await page.waitForTimeout(2000); // 2 seconds
await page.waitForTimeout(1000); // 1 second
```

### In the configuration:
```typescript
// Adjust global slowMo
launchOptions: {
  slowMo: 2000, // 2 seconds between operations
},

// Adjust timeouts
actionTimeout: 60000, // 60 seconds for actions
navigationTimeout: 120000, // 2 minutes for navigation
```

## Troubleshooting

### Common Issues:

1. **Timeout errors**: Increase timeouts in the configuration
2. **Element not found**: Check if selectors match your UI
3. **Navigation failures**: Verify the development server is running
4. **Authentication issues**: Update test credentials

### Debug Commands:
```bash
# Show test report
npx playwright show-report

# Run with verbose logging
DEBUG=pw:api npx playwright test add-products.spec.ts

# Generate trace files
npx playwright test add-products.spec.ts --trace=on
```

## Notes

- **No image uploads**: These tests focus on product data entry without file uploads
- **Realistic data**: Uses realistic product names, descriptions, and pricing
- **Comprehensive coverage**: Tests add, edit, delete, and validation scenarios
- **Slow execution**: Designed for demonstration and debugging purposes
- **Single browser**: Optimized for Chromium to ensure consistency
