import { useEffect, useRef } from 'react';
import logger from '../utils/logger';

/**
 * Editor keyboard shortcuts hook
 * Handles editor-specific shortcuts like Tab for indent, Ctrl+B for bold, etc.
 */
export const useEditorShortcuts = ({
  onGenerate,
  canGenerate,
  isLoading,
  enabled = true
}) => {
  const callbacksRef = useRef({ onGenerate, canGenerate, isLoading });

  useEffect(() => {
    callbacksRef.current = { onGenerate, canGenerate, isLoading };
  }, [onGenerate, canGenerate, isLoading]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const target = e.target;
      const isTextarea = target.tagName === 'TEXTAREA';
      const isContentEditable = target.isContentEditable;

      // Only handle in textarea or contenteditable
      if (!isTextarea && !isContentEditable) return;

      // Detect platform
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Tab: Indent (insert spaces/tab)
      if (e.key === 'Tab' && !e.shiftKey && !modifier && !e.altKey) {
        // Only if not in a list or special context
        if (isTextarea) {
          e.preventDefault();
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const value = target.value;
          
          // Insert tab at cursor position
          const newValue = value.substring(0, start) + '    ' + value.substring(end);
          target.value = newValue;
          
          // Set cursor position after inserted tab
          target.selectionStart = target.selectionEnd = start + 4;
          
          // Trigger input event for React
          const event = new Event('input', { bubbles: true });
          target.dispatchEvent(event);
        }
        return;
      }

      // Shift+Tab: Outdent (remove spaces)
      if (e.key === 'Tab' && e.shiftKey && !modifier && !e.altKey) {
        if (isTextarea) {
          e.preventDefault();
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const value = target.value;
          
          // Get line start
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = value.indexOf('\n', end);
          const lineEndPos = lineEnd === -1 ? value.length : lineEnd;
          
          // Check if line starts with spaces
          const line = value.substring(lineStart, lineEndPos);
          if (line.startsWith('    ')) {
            const newValue = 
              value.substring(0, lineStart) + 
              line.substring(4) + 
              value.substring(lineEndPos);
            target.value = newValue;
            
            // Adjust cursor position
            const newStart = Math.max(lineStart, start - 4);
            const newEnd = Math.max(lineStart, end - 4);
            target.selectionStart = newStart;
            target.selectionEnd = newEnd;
            
            // Trigger input event
            const event = new Event('input', { bubbles: true });
            target.dispatchEvent(event);
          }
        }
        return;
      }

      // Ctrl/Cmd + Enter: Generate audio
      if (modifier && e.key === 'Enter') {
        e.preventDefault();
        if (callbacksRef.current.canGenerate && !callbacksRef.current.isLoading) {
          callbacksRef.current.onGenerate?.();
          logger.debug('Triggered audio generation via Ctrl+Enter');
        }
        return;
      }

      // Ctrl/Cmd + B: Bold (if markdown support added in future)
      // For now, just prevent default to avoid browser bold behavior
      if (modifier && (e.key === 'b' || e.key === 'B')) {
        // Could implement markdown bold here: **text**
        // For now, just prevent browser default
        if (isContentEditable) {
          e.preventDefault();
          // Future: Insert ** at cursor position
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
};
