import { useRef, useEffect } from 'react';

/**
 * Hook to enable Tab key indentation in textarea elements
 * Allows Tab to indent and Shift+Tab to outdent
 */
export const useTabIndent = (textareaRef) => {
    useEffect(() => {
        const textarea = textareaRef?.current;
        if (!textarea) return;

        const handleKeyDown = (e) => {
            // Only handle Tab when not in a modal or special context
            if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;

                // If Shift+Tab, outdent
                if (e.shiftKey) {
                    e.preventDefault();
                    
                    // Find the start of the current line
                    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                    const selectedText = value.substring(lineStart, end);
                    const lines = selectedText.split('\n');
                    
                    // Remove leading tab or 4 spaces from each line
                    const outdentedLines = lines.map(line => {
                        if (line.startsWith('\t')) {
                            return line.substring(1);
                        } else if (line.startsWith('    ')) {
                            return line.substring(4);
                        }
                        return line;
                    });
                    
                    const newText = outdentedLines.join('\n');
                    const newValue = value.substring(0, lineStart) + newText + value.substring(end);
                    const indentRemoved = lines.some(line => line.startsWith('\t') || line.startsWith('    '));
                    const newStart = indentRemoved ? Math.max(lineStart, start - (lines[0].startsWith('\t') ? 1 : 4)) : start;
                    const newEnd = newStart + newText.length;
                    
                    textarea.value = newValue;
                    textarea.setSelectionRange(newStart, newEnd);
                    
                    // Trigger onChange event
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);
                    return;
                }

                // Regular Tab - indent
                e.preventDefault();
                
                // If there's a selection, indent all selected lines
                if (start !== end) {
                    const selectedText = value.substring(start, end);
                    const lines = selectedText.split('\n');
                    
                    // Add tab or 4 spaces to each line
                    const indentedLines = lines.map(line => '\t' + line);
                    const newText = indentedLines.join('\n');
                    const newValue = value.substring(0, start) + newText + value.substring(end);
                    
                    textarea.value = newValue;
                    textarea.setSelectionRange(start, start + newText.length);
                    
                    // Trigger onChange event
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);
                } else {
                    // No selection - just insert tab at cursor
                    const newValue = value.substring(0, start) + '\t' + value.substring(end);
                    textarea.value = newValue;
                    textarea.setSelectionRange(start + 1, start + 1);
                    
                    // Trigger onChange event
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);
                }
            }
        };

        textarea.addEventListener('keydown', handleKeyDown);
        
        return () => {
            textarea.removeEventListener('keydown', handleKeyDown);
        };
    }, [textareaRef]);
};

