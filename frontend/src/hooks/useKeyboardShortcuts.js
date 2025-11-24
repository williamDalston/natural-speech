import { useEffect } from 'react';

export const useKeyboardShortcuts = ({
  onGenerate,
  canGenerate,
  isLoading,
  activeTab,
  setActiveTab,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (canGenerate && !isLoading) {
          onGenerate();
        }
      }

      // Number keys to switch tabs (1 for TTS, 2 for Avatar)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('tts');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('avatar');
        }
      }

      // Escape to clear errors or close modals
      if (e.key === 'Escape') {
        // Could be used for closing modals, clearing errors, etc.
        // This is a placeholder for future functionality
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGenerate, canGenerate, isLoading, activeTab, setActiveTab]);
};

