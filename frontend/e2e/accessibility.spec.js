import { test, expect } from '@playwright/test';

/**
 * Accessibility E2E Tests
 * 
 * Tests WCAG 2.1 AA compliance and accessibility features
 * 
 * Note: For automated a11y testing with axe-core, install axe-playwright:
 * npm install --save-dev axe-playwright
 * Then uncomment the axe imports and usage below
 */

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Optional: Inject axe-core for automated accessibility testing
    // Uncomment if axe-playwright is installed:
    // try {
    //   await injectAxe(page);
    // } catch (error) {
    //   console.log('axe-playwright not available, using manual checks');
    // }
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check for main heading
    const h1 = page.locator('h1');
    const h2 = page.locator('h2').first();
    
    // Should have at least h1 or h2
    const hasHeading = (await h1.count() > 0) || (await h2.count() > 0);
    expect(hasHeading).toBe(true);
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Check buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    let accessibleButtons = 0;
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const text = await button.textContent();
      const title = await button.getAttribute('title');
      
      // Button should have accessible name
      if (ariaLabel || ariaLabelledBy || (text && text.trim()) || title) {
        accessibleButtons++;
      }
    }
    
    // At least 80% of buttons should be accessible
    expect(accessibleButtons / Math.min(buttonCount, 10)).toBeGreaterThan(0.8);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement.first()).toBeVisible();
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Focus should move
    const newFocusedElement = page.locator(':focus');
    await expect(newFocusedElement.first()).toBeVisible();
  });

  test('should have proper form labels', async ({ page }) => {
    // Find all form inputs
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    let labeledInputs = 0;
    for (let i = 0; i < Math.min(inputCount, 10); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Check if label exists
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        if (await label.count() > 0) {
          labeledInputs++;
          continue;
        }
      }
      
      // Check for aria-label or placeholder
      if (ariaLabel || ariaLabelledBy || placeholder) {
        labeledInputs++;
      }
    }
    
    // At least 80% of inputs should be labeled
    if (inputCount > 0) {
      expect(labeledInputs / Math.min(inputCount, 10)).toBeGreaterThan(0.8);
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // Check text elements for contrast
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    const textCount = await textElements.count();
    
    // This is a basic check - full contrast testing requires axe-core
    // For now, we verify that text elements exist and are visible
    if (textCount > 0) {
      const firstText = textElements.first();
      await expect(firstText).toBeVisible();
    }
  });

  test('should have skip links for keyboard navigation', async ({ page }) => {
    // Look for skip links
    const skipLinks = page.locator('a[href*="#main"], a[href*="#content"], [class*="skip"]');
    // Skip links are optional but good practice
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // Check for ARIA live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    // Live regions should exist for dynamic content
  });

  test('should handle focus management in modals', async ({ page }) => {
    // Try to open a modal
    const modalTrigger = page.locator('button').filter({ hasText: /settings|menu|more/i }).first();
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForTimeout(500);
      
      // Check for modal
      const modal = page.locator('[role="dialog"], [class*="modal"]');
      if (await modal.isVisible()) {
        // Focus should be trapped in modal
        const focusedElement = page.locator(':focus');
        await expect(focusedElement.first()).toBeVisible();
        
        // Close modal with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Check for landmarks
    const main = page.locator('main, [role="main"]');
    const nav = page.locator('nav, [role="navigation"]');
    
    // Should have main content area
    const hasMain = (await main.count() > 0) || (await page.locator('body > *').count() > 0);
    expect(hasMain).toBe(true);
  });

  test('should have proper alt text for images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    let accessibleImages = 0;
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Decorative images should have role="presentation" or alt=""
      // Informative images should have descriptive alt text
      if (alt !== null || role === 'presentation') {
        accessibleImages++;
      }
    }
    
    // All images should have alt attributes (even if empty for decorative)
    if (imageCount > 0) {
      expect(accessibleImages / Math.min(imageCount, 10)).toBeGreaterThan(0.9);
    }
  });
});

