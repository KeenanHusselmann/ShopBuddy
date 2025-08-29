# Example Commands to Run Slow Execution Tests

## Quick Start

### 1. Run All Slow Tests
```bash
npm run test:slow
```

### 2. Run Product Tests with Slow Execution
```bash
npm run test:products:slow
```

### 3. Run with Visible Browser (Headed Mode)
```bash
npm run test:slow:headed
```

### 4. Run in Debug Mode
```bash
npm run test:slow:debug
```

## Direct Playwright Commands

### Using Slow Configuration
```bash
npx playwright test --config=playwright.slow.config.ts
```

### Run Specific Test File
```bash
npx playwright test add-products.spec.ts --config=playwright.slow.config.ts
```

### Run with Headed Browser
```bash
npx playwright test add-products.spec.ts --config=playwright.slow.config.ts --headed
```

## Test Execution Time

- **Fast mode**: ~30 seconds (default Playwright)
- **Slow mode**: 3-5 minutes (with delays and slowMo)
- **Debug mode**: Variable (depends on your interaction)

## What You'll See

1. **Login process** with delays
2. **Navigation** through dashboard sidebar
3. **Single product addition** with realistic data
4. **Form validation** testing
5. **Product editing** functionality
6. **Product deletion** testing

## Notes

- Tests will execute slowly with visible delays
- No image uploads are performed
- Uses realistic product data
- Designed for demonstration and debugging
- Single browser execution (Chromium)
