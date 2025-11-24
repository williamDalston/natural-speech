import { test, expect } from '@playwright/test';

/**
 * Example E2E tests for Natural Speech
 * 
 * These tests require:
 * 1. Backend server running on http://localhost:8000
 * 2. Frontend server running on http://localhost:5173
 * 
 * Run with: npx playwright test
 */

test.describe('Natural Speech E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('h2', { timeout: 10000 });
  });

  test('should load the application', async ({ page }) => {
    // Check that the main heading is visible
    await expect(page.locator('h2')).toContainText('Text to Speech');
  });

  test('should display text input field', async ({ page }) => {
    // Check that text input is present
    const textInput = page.locator('textarea[placeholder*="script"]');
    await expect(textInput).toBeVisible();
  });

  test('should allow typing in text input', async ({ page }) => {
    const textInput = page.locator('textarea[placeholder*="script"]');
    await textInput.fill('Hello, this is a test');
    await expect(textInput).toHaveValue('Hello, this is a test');
  });

  test('should display voice selector', async ({ page }) => {
    // Wait for voices to load
    await page.waitForTimeout(2000);
    
    const voiceSelect = page.locator('select[id*="voice"]');
    await expect(voiceSelect).toBeVisible();
  });

  test('should switch between TTS and Avatar tabs', async ({ page }) => {
    // Check initial tab
    await expect(page.locator('h2')).toContainText('Text to Speech');
    
    // Switch to Avatar tab (adjust selector based on actual implementation)
    const avatarTab = page.locator('button, a').filter({ hasText: /avatar/i }).first();
    if (await avatarTab.isVisible()) {
      await avatarTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('h2')).toContainText('Avatar');
    }
  });

  test('should show character count', async ({ page }) => {
    const textInput = page.locator('textarea[placeholder*="script"]');
    await textInput.fill('Test');
    
    // Check for character count display
    const charCount = page.locator('text=/\\d+ \\/ \\d+ characters/i');
    await expect(charCount).toBeVisible();
  });
});

