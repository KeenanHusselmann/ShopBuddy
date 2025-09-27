# Running Shop Owner Signup Tests

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **In a new terminal, run the tests:**
   ```bash
   # Run all tests
   npm test
   
   # Run specific test file
   npx playwright test shop-owner-signup.spec.ts
   
   # Run tests in headed mode (see browser)
   npx playwright test --headed
   
   # Run tests with debug mode
   npx playwright test --debug
   ```

## Test Files

- **`shop-owner-signup.spec.ts`** - Basic signup flow tests (27 tests)
- **`shop-owner-signup-complete.spec.ts`** - Complete signup process tests (27 tests)

## Test Categories

### Basic Tests (shop-owner-signup.spec.ts)
- ✅ Display shop owner portal on home page
- ✅ Navigation to signup page
- ✅ Form field validation
- ✅ Password requirements
- ✅ Mode switching (signup/signin)
- ✅ Form submission
- ✅ Error handling
- ✅ Responsive design
- ✅ Accessibility features

### Complete Tests (shop-owner-signup-complete.spec.ts)
- ✅ Full signup process
- ✅ Password validation
- ✅ Form interactions
- ✅ Responsive design testing
- ✅ Accessibility testing
- ✅ Error handling and recovery

## Running Specific Tests

```bash
# Run only basic tests
npx playwright test shop-owner-signup.spec.ts

# Run only complete tests
npx playwright test shop-owner-signup-complete.spec.ts

# Run tests matching a pattern
npx playwright test -g "should display"

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Output

- **HTML Report:** `npx playwright show-report`
- **Screenshots:** Automatically captured on failure
- **Videos:** Automatically recorded on failure
- **Traces:** Available for debugging

## Troubleshooting

### Common Issues

1. **Port 8080 in use:** Make sure dev server is running
2. **Tests timing out:** Check if dev server is accessible
3. **Form not found:** Verify the page has loaded completely

### Debug Mode

Use `--debug` flag to step through tests:
```bash
npx playwright test --debug
```

### Manual Testing

Use Playwright's codegen to record actions:
```bash
npx playwright codegen http://localhost:8080
```

## Test Data

Tests use unique, generated data:
- Unique email addresses with timestamps
- Strong passwords (TestPassword123!)
- Realistic names and information

## Environment Variables

Customize test behavior:
```bash
# Base URL
PLAYWRIGHT_BASE_URL=http://localhost:8080

# Browser settings
PLAYWRIGHT_HEADLESS=false
PLAYWRIGHT_SLOW_MO=1000

# Media capture
PLAYWRIGHT_SCREENSHOT=true
PLAYWRIGHT_VIDEO=true
```
