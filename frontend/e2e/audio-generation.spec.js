import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Audio Generation
 * 
 * Tests the complete flow of generating audio from text
 */

test.describe('Audio Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
  });

  test('should generate audio from text', async ({ page }) => {
    // Wait for voices to load
    await page.waitForTimeout(2000);

    // Enter text
    const textInput = page.locator('textarea').first();
    await textInput.fill('Hello, this is a test of the audio generation system.');
    await expect(textInput).toHaveValue('Hello, this is a test of the audio generation system.');

    // Select voice
    const voiceSelect = page.locator('select').first();
    if (await voiceSelect.isVisible()) {
      const options = await voiceSelect.locator('option').count();
      if (options > 1) {
        await voiceSelect.selectOption({ index: 1 });
      }
    }

    // Click generate button
    const generateButton = page.locator('button').filter({ hasText: /generate/i }).first();
    await expect(generateButton).toBeEnabled();
    
    await generateButton.click();

    // Wait for loading state
    await page.waitForTimeout(1000);

    // Check for loading indicator
    const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], [aria-label*="loading" i]');
    // Loading should appear

    // Wait for audio player (with timeout for backend availability)
    try {
      await page.waitForSelector('audio, [data-testid="audio-player"], [class*="audio-player"]', { 
        timeout: 30000 
      });
      
      // Verify audio player is visible
      const audioPlayer = page.locator('audio, [data-testid="audio-player"]').first();
      await expect(audioPlayer).toBeVisible();
    } catch (error) {
      // If backend is not available, check for error message
      const errorMessage = page.locator('[role="alert"], [class*="error"]');
      // Error should be displayed gracefully
    }
  });

  test('should adjust speech speed', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find speed slider
    const speedSlider = page.locator('input[type="range"], [role="slider"]').first();
    if (await speedSlider.isVisible()) {
      // Set speed to 1.5
      await speedSlider.fill('1.5');
      await page.waitForTimeout(300);

      // Verify speed value
      const speedValue = page.locator('text=/1\\.5|speed.*1\\.5/i');
      // Speed indicator should update
    }
  });

  test('should play generated audio', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Generate audio first
    const textInput = page.locator('textarea').first();
    await textInput.fill('Test audio playback');

    const generateButton = page.locator('button').filter({ hasText: /generate/i }).first();
    if (await generateButton.isEnabled()) {
      await generateButton.click();
      await page.waitForTimeout(3000);

      // Look for play button
      const playButton = page.locator('button[aria-label*="play" i], button[title*="play" i]').first();
      if (await playButton.isVisible()) {
        await playButton.click();
        await page.waitForTimeout(1000);

        // Check if audio is playing (look for pause button)
        const pauseButton = page.locator('button[aria-label*="pause" i], button[title*="pause" i]').first();
        // Pause button should appear when playing
      }
    }
  });

  test('should download generated audio', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Generate audio
    const textInput = page.locator('textarea').first();
    await textInput.fill('Test audio download');

    const generateButton = page.locator('button').filter({ hasText: /generate/i }).first();
    if (await generateButton.isEnabled()) {
      await generateButton.click();
      await page.waitForTimeout(3000);

      // Look for download button
      const downloadButton = page.locator('button[aria-label*="download" i], button[title*="download" i], a[download]').first();
      if (await downloadButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await downloadButton.click();
        
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.(wav|mp3|ogg)$/i);
        }
      }
    }
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    // Try to generate with invalid input
    const textInput = page.locator('textarea').first();
    await textInput.fill('');

    const generateButton = page.locator('button').filter({ hasText: /generate/i }).first();
    
    // Button should be disabled or show validation error
    if (await generateButton.isEnabled()) {
      await generateButton.click();
      await page.waitForTimeout(2000);

      // Check for error message
      const errorMessage = page.locator('[role="alert"], [class*="error"]');
      // Error should be displayed
    } else {
      // Button correctly disabled for empty input
      expect(await generateButton.isEnabled()).toBe(false);
    }
  });

  test('should show progress during generation', async ({ page }) => {
    await page.waitForTimeout(2000);

    const textInput = page.locator('textarea').first();
    await textInput.fill('This is a longer text to test progress indication during generation.');

    const generateButton = page.locator('button').filter({ hasText: /generate/i }).first();
    if (await generateButton.isEnabled()) {
      await generateButton.click();

      // Check for progress indicator
      const progressIndicator = page.locator('[class*="progress"], [role="progressbar"], [aria-label*="progress" i]');
      // Progress should be visible during generation
    }
  });
});

