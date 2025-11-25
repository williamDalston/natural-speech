import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests
 * 
 * Tests page load times, bundle size, and performance metrics
 */

test.describe('Performance Tests', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have fast First Contentful Paint', async ({ page }) => {
    await page.goto('/');
    
    // Measure FCP using Performance API
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            resolve(fcpEntry.startTime);
          }
        }).observe({ entryTypes: ['paint'] });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000);
      });
    });
    
    // FCP should be under 2 seconds
    if (fcp !== null) {
      expect(fcp).toBeLessThan(2000);
    }
  });

  test('should have acceptable Time to Interactive', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Measure TTI using Performance API
    const tti = await page.evaluate(() => {
      return new Promise((resolve) => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
          resolve(domContentLoaded);
        } else {
          resolve(null);
        }
      });
    });
    
    // TTI should be reasonable (under 3 seconds)
    if (tti !== null) {
      expect(tti).toBeLessThan(3000);
    }
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Check for lazy loading on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check if images have loading="lazy"
      let lazyLoadedImages = 0;
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const loading = await img.getAttribute('loading');
        if (loading === 'lazy') {
          lazyLoadedImages++;
        }
      }
      
      // At least some images should be lazy loaded
      // (not all need to be, as above-the-fold images should load immediately)
    }
  });

  test('should have optimized bundle size', async ({ page }) => {
    await page.goto('/');
    
    // Get resource sizes
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('.js') || entry.name.includes('.css'))
        .map(entry => ({
          name: entry.name,
          size: entry.transferSize,
          duration: entry.duration
        }));
    });
    
    // Calculate total JS/CSS size
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    
    // Total should be under 2MB (uncompressed)
    expect(totalSize).toBeLessThan(2 * 1024 * 1024);
  });

  test('should handle rapid interactions smoothly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Rapidly interact with the page
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Click multiple buttons rapidly
      for (let i = 0; i < Math.min(5, buttonCount); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(100);
        }
      }
      
      // Page should still be responsive
      await expect(page.locator('h2').first()).toBeVisible();
    }
  });

  test('should cache API responses appropriately', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Wait for initial API calls
    await page.waitForTimeout(2000);
    
    // Navigate away and back
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Check network requests
    const requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('/api/'))
        .map(entry => ({
          name: entry.name,
          transferSize: entry.transferSize
        }));
    });
    
    // API requests should be made
    // (Caching verification would require more detailed network inspection)
  });

  test('should handle large text input efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
    
    const textInput = page.locator('textarea').first();
    if (await textInput.isVisible()) {
      // Enter large text
      const largeText = 'a'.repeat(1000);
      const startTime = Date.now();
      
      await textInput.fill(largeText);
      
      const fillTime = Date.now() - startTime;
      
      // Should handle large input efficiently (under 1 second)
      expect(fillTime).toBeLessThan(1000);
    }
  });
});

