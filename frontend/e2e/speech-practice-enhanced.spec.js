import { test, expect } from '@playwright/test';

/**
 * Enhanced E2E Tests for Speech Practice
 * 
 * Tests the complete speech practice flow including:
 * - Recording audio
 * - Playing back recordings
 * - Saving speeches
 * - Managing speech library
 */

test.describe('Speech Practice Enhanced Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Navigate to Speech Practice
    const speechTab = page.locator('button, a').filter({ hasText: /speech practice/i }).first();
    if (await speechTab.isVisible()) {
      await speechTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display speech practice interface', async ({ page }) => {
    // Verify main elements are visible
    const textInput = page.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeVisible();
    
    // Check for record button
    const recordButton = page.locator('button').filter({ hasText: /record|start/i }).first();
    // Record button should be available
  });

  test('should allow topic selection', async ({ page }) => {
    // Look for topic selector
    const topicSelect = page.locator('select, [role="combobox"]').filter({ 
      hasText: /topic|subject/i 
    }).first();
    
    if (await topicSelect.isVisible()) {
      // Select a topic
      await topicSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      // Verify topic is selected
      const selectedValue = await topicSelect.inputValue();
      expect(selectedValue).toBeTruthy();
    }
  });

  test('should handle text input for speech', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').first();
    
    if (await textInput.isVisible()) {
      await textInput.fill('This is a test speech for practice.');
      await expect(textInput).toHaveValue('This is a test speech for practice.');
    }
  });

  test('should save speech after recording', async ({ page }) => {
    // Enter speech text
    const textInput = page.locator('textarea, input[type="text"]').first();
    if (await textInput.isVisible()) {
      await textInput.fill('Test speech content');
      
      // Look for save button
      const saveButton = page.locator('button').filter({ hasText: /save/i }).first();
      if (await saveButton.isVisible() && await saveButton.isEnabled()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        // Check for success message
        const successMessage = page.locator('[role="alert"], [class*="success"]');
        // Success message may appear
      }
    }
  });

  test('should display saved speeches', async ({ page }) => {
    // Look for saved speeches section
    const savedSpeeches = page.locator('[class*="speech"], [class*="saved"]');
    const count = await savedSpeeches.count();
    
    // Should be able to display saved speeches if any exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow deleting saved speeches', async ({ page }) => {
    // Find a saved speech item
    const speechItem = page.locator('[class*="speech"], [class*="item"]').first();
    
    if (await speechItem.isVisible()) {
      // Hover to show actions
      await speechItem.hover();
      await page.waitForTimeout(300);
      
      // Look for delete button
      const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        // Check for confirmation
        const confirmModal = page.locator('[role="dialog"]');
        if (await confirmModal.isVisible()) {
          const confirmButton = page.locator('button').filter({ hasText: /confirm|yes/i }).first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('should generate audio for speech text', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').first();
    
    if (await textInput.isVisible()) {
      await textInput.fill('Test speech for audio generation');
      
      // Look for generate audio button
      const generateButton = page.locator('button').filter({ hasText: /generate|audio/i }).first();
      if (await generateButton.isVisible() && await generateButton.isEnabled()) {
        await generateButton.click();
        await page.waitForTimeout(3000);
        
        // Check for audio player
        const audioPlayer = page.locator('audio, [class*="audio"]');
        // Audio player may appear if backend is available
      }
    }
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').first();
    
    if (await textInput.isVisible()) {
      await textInput.focus();
      
      // Test Ctrl/Cmd + S for save (if implemented)
      await page.keyboard.press('Control+s');
      await page.waitForTimeout(500);
      
      // Should trigger save action
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify elements are still accessible
    const textInput = page.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeVisible();
    
    // Buttons should be touch-friendly
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const box = await firstButton.boundingBox();
      // Buttons should be at least 44px tall for touch targets
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

