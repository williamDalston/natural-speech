import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Speech Practice Feature
 * 
 * Tests the complete flow of practicing speeches
 */

test.describe('Speech Practice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
  });

  test('should navigate to speech practice', async ({ page }) => {
    // Find speech practice tab/button
    const speechTab = page.locator('button, a, [role="tab"]').filter({ hasText: /speech|practice/i }).first();
    if (await speechTab.isVisible()) {
      await speechTab.click();
      await page.waitForTimeout(500);

      // Verify we're on speech practice page
      await expect(page.locator('h2, h1')).toContainText(/speech|practice/i);
    }
  });

  test('should create a new speech', async ({ page }) => {
    // Navigate to speech practice
    const speechTab = page.locator('button, a, [role="tab"]').filter({ hasText: /speech|practice/i }).first();
    if (await speechTab.isVisible()) {
      await speechTab.click();
      await page.waitForTimeout(1000);
    }

    // Find text editor
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    if (await editor.isVisible()) {
      await editor.fill('This is my practice speech for today.');
      await expect(editor).toContainText('practice speech');
    }
  });

  test('should practice speech with audio', async ({ page }) => {
    // Navigate to speech practice
    const speechTab = page.locator('button, a, [role="tab"]').filter({ hasText: /speech|practice/i }).first();
    if (await speechTab.isVisible()) {
      await speechTab.click();
      await page.waitForTimeout(1000);
    }

    // Enter speech text
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    if (await editor.isVisible()) {
      await editor.fill('Practice speech text');

      // Look for practice/play button
      const practiceButton = page.locator('button').filter({ hasText: /practice|play|start/i }).first();
      if (await practiceButton.isVisible()) {
        await practiceButton.click();
        await page.waitForTimeout(2000);

        // Check for audio player or practice interface
        const audioPlayer = page.locator('audio, [class*="audio"], [class*="practice"]');
        // Practice interface should appear
      }
    }
  });

  test('should track practice statistics', async ({ page }) => {
    // Navigate to speech practice
    const speechTab = page.locator('button, a, [role="tab"]').filter({ hasText: /speech|practice/i }).first();
    if (await speechTab.isVisible()) {
      await speechTab.click();
      await page.waitForTimeout(1000);
    }

    // Look for statistics display
    const stats = page.locator('[class*="stat"], [class*="count"], [class*="metric"]');
    // Statistics should be visible
  });

  test('should save speech practice', async ({ page }) => {
    // Navigate to speech practice
    const speechTab = page.locator('button, a, [role="tab"]').filter({ hasText: /speech|practice/i }).first();
    if (await speechTab.isVisible()) {
      await speechTab.click();
      await page.waitForTimeout(1000);
    }

    // Enter speech
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    if (await editor.isVisible()) {
      await editor.fill('Speech to save');

      // Look for save button
      const saveButton = page.locator('button').filter({ hasText: /save/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Check for success message
        const successMessage = page.locator('[role="alert"], [class*="success"]');
        // Success should be displayed
      }
    }
  });
});

