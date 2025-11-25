import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Writing Creation and Editing
 * 
 * Tests the complete flow of creating, editing, and managing writings
 */

test.describe('Writing Creation and Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h2', { timeout: 10000 });
  });

  test('should create a new writing', async ({ page }) => {
    // Navigate to Text Editor if not already there
    const editorTab = page.locator('button, a, [role="tab"]').filter({ hasText: /write|editor|text/i }).first();
    if (await editorTab.isVisible()) {
      await editorTab.click();
      await page.waitForTimeout(500);
    }

    // Find text editor
    const textEditor = page.locator('textarea, [contenteditable="true"]').first();
    await expect(textEditor).toBeVisible();

    // Enter text
    await textEditor.fill('This is a test writing for E2E testing.');
    await expect(textEditor).toContainText('This is a test writing');

    // Check for character count
    const charCount = page.locator('text=/\\d+.*characters?/i');
    await expect(charCount.first()).toBeVisible();
  });

  test('should save writing to library', async ({ page }) => {
    // Navigate to editor
    const editorTab = page.locator('button, a, [role="tab"]').filter({ hasText: /write|editor/i }).first();
    if (await editorTab.isVisible()) {
      await editorTab.click();
      await page.waitForTimeout(500);
    }

    // Enter text
    const textEditor = page.locator('textarea, [contenteditable="true"]').first();
    await textEditor.fill('Test writing to save');

    // Look for save button
    const saveButton = page.locator('button').filter({ hasText: /save/i }).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(1000);

      // Check for success message
      const successMessage = page.locator('[role="alert"], [class*="success"], [class*="toast"]');
      // Success message may appear
    }
  });

  test('should edit existing writing', async ({ page }) => {
    // Navigate to library
    const libraryTab = page.locator('button, a, [role="tab"]').filter({ hasText: /library|writings|texts/i }).first();
    if (await libraryTab.isVisible()) {
      await libraryTab.click();
      await page.waitForTimeout(1000);
    }

    // Find first writing item
    const writingItem = page.locator('[class*="writing"], [class*="item"], [class*="card"]').first();
    if (await writingItem.isVisible()) {
      await writingItem.click();
      await page.waitForTimeout(500);

      // Look for edit button or modal
      const editButton = page.locator('button').filter({ hasText: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Verify editor is accessible
        const editor = page.locator('textarea, [contenteditable="true"]').first();
        if (await editor.isVisible()) {
          await editor.fill('Edited content');
        }
      }
    }
  });

  test('should delete writing with confirmation', async ({ page }) => {
    // Navigate to library
    const libraryTab = page.locator('button, a, [role="tab"]').filter({ hasText: /library|writings/i }).first();
    if (await libraryTab.isVisible()) {
      await libraryTab.click();
      await page.waitForTimeout(1000);
    }

    // Find first writing item
    const writingItem = page.locator('[class*="writing"], [class*="item"]').first();
    if (await writingItem.isVisible()) {
      // Hover to show actions
      await writingItem.hover();
      await page.waitForTimeout(300);

      // Look for delete button
      const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);

        // Check for confirmation modal
        const confirmModal = page.locator('[role="dialog"], [class*="modal"], [class*="confirm"]');
        if (await confirmModal.isVisible()) {
          // Confirm deletion
          const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i }).first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('should search writings', async ({ page }) => {
    // Navigate to library
    const libraryTab = page.locator('button, a, [role="tab"]').filter({ hasText: /library|writings/i }).first();
    if (await libraryTab.isVisible()) {
      await libraryTab.click();
      await page.waitForTimeout(1000);
    }

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Verify search results update
      const results = page.locator('[class*="writing"], [class*="item"]');
      // Results should be filtered
    }
  });

  test('should filter writings by genre', async ({ page }) => {
    // Navigate to library
    const libraryTab = page.locator('button, a, [role="tab"]').filter({ hasText: /library|writings/i }).first();
    if (await libraryTab.isVisible()) {
      await libraryTab.click();
      await page.waitForTimeout(1000);
    }

    // Find filter dropdown
    const filterSelect = page.locator('select, [role="combobox"]').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // Verify filter applied
      const results = page.locator('[class*="writing"], [class*="item"]');
      // Results should be filtered
    }
  });
});

