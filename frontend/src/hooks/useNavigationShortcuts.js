import { useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Navigation keyboard shortcuts hook
 * Handles number keys (1-9) for navigating to sidebar items
 */
export const useNavigationShortcuts = ({
  setActiveTab,
  menuItems = [],
  enabled = true
}) => {
  useEffect(() => {
    if (!enabled || menuItems.length === 0) return;

    const handleKeyDown = (e) => {
      // Don't handle if user is typing in input/textarea/contenteditable
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;
      
      // Only handle number keys when not in input and no modifiers
      if (isInput || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }

      // Handle number keys 1-9
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 9 && keyNum <= menuItems.length) {
        e.preventDefault();
        const menuItem = menuItems[keyNum - 1];
        if (menuItem && menuItem.id) {
          setActiveTab(menuItem.id);
          logger.debug(`Navigated to ${menuItem.label} via keyboard shortcut`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, menuItems, setActiveTab]);
};

