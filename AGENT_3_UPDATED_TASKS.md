# Agent 3: "Keyboard Shortcut Wizard" - Updated Task List
**Status:** ⚠️ Partial (70% Complete)  
**Priority:** 🟡 High  
**Estimated Remaining Time:** 1-2 hours  
**Last Updated:** January 2025

---

## Current Status

### ✅ Completed
- [x] Keyboard shortcuts component created (`KeyboardShortcuts.jsx`)
- [x] Basic keyboard shortcut hook (`useKeyboardShortcuts.js`)
- [x] `Ctrl/Cmd + Enter`: Generate audio (implemented)
- [x] `1-2`: Switch tabs (TTS/Avatar) (implemented)
- [x] `Esc`: Close dialogs (partially implemented)
- [x] Help modal structure exists
- [x] Spacebar: Play/pause audio (in AudioPlayer)

### ⚠️ Partially Complete
- [⚠️] `Esc`: Close modals (structure exists, needs full implementation)
- [⚠️] Help modal (structure exists, needs all shortcuts documented)

### ❌ Not Started
- [ ] `Ctrl/Cmd + K`: Quick search
- [ ] `Ctrl/Cmd + N`: New writing
- [ ] `Ctrl/Cmd + S`: Save
- [ ] `Ctrl/Cmd + /`: Show shortcuts help
- [ ] `1-8`: Navigate to sidebar items (only 1-2 implemented)
- [ ] `Ctrl/Cmd + ←/→`: Previous/Next writing
- [ ] `Tab`: Indent in textarea
- [ ] Complete shortcuts help modal

---

## Updated Task List

### Phase 1: Global Shortcuts (Priority: High) - 30 minutes

#### 1. Create Global Keyboard Shortcut Handler
**File:** `frontend/src/hooks/useGlobalKeyboardShortcuts.js` (NEW)

**Tasks:**
- [ ] Create new hook for global shortcuts
- [ ] Handle modifier keys (Ctrl/Cmd detection)
- [ ] Prevent default browser behavior
- [ ] Support both Windows (Ctrl) and Mac (Cmd)
- [ ] Add cleanup on unmount

**Implementation:**
```javascript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useGlobalKeyboardShortcuts = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      // Ctrl/Cmd + K: Quick search
      if (modifier && e.key === 'k') {
        e.preventDefault();
        // Open search modal/overlay
      }
      
      // Ctrl/Cmd + N: New writing
      if (modifier && e.key === 'n') {
        e.preventDefault();
        navigate('/editor');
        // Focus title input after navigation
      }
      
      // Ctrl/Cmd + S: Save
      if (modifier && e.key === 's') {
        e.preventDefault();
        // Trigger save in current editor
      }
      
      // Ctrl/Cmd + /: Show shortcuts help
      if (modifier && e.key === '/') {
        e.preventDefault();
        // Open KeyboardShortcuts modal
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
};
```

#### 2. Implement Quick Search (`Ctrl/Cmd + K`)
**Files to Modify:**
- `frontend/src/components/AdvancedSearch.jsx`
- `frontend/src/App.jsx`

**Tasks:**
- [ ] Add search modal/overlay component
- [ ] Focus search input when `Ctrl/Cmd + K` pressed
- [ ] Integrate with existing search functionality
- [ ] Add keyboard navigation in search results
- [ ] Close on `Esc`

**Implementation Notes:**
- Can reuse existing AdvancedSearch component
- Add overlay/modal wrapper
- Focus management on open

#### 3. Implement New Writing (`Ctrl/Cmd + N`)
**Files to Modify:**
- `frontend/src/App.jsx`
- `frontend/src/components/TextEditor.jsx`

**Tasks:**
- [ ] Navigate to editor on shortcut
- [ ] Focus title input after navigation
- [ ] Show visual feedback (toast notification)
- [ ] Handle if already on editor page

#### 4. Implement Save (`Ctrl/Cmd + S`)
**Files to Modify:**
- `frontend/src/components/TextEditor.jsx`
- `frontend/src/components/SpeechPractice.jsx`
- `frontend/src/components/PoemCreator.jsx`

**Tasks:**
- [ ] Detect current editor context
- [ ] Trigger appropriate save function
- [ ] Prevent default browser save dialog
- [ ] Show save confirmation
- [ ] Handle unsaved changes warning

**Implementation Notes:**
- Need to track which editor is active
- Use context or state management
- Integrate with existing auto-save

#### 5. Implement Shortcuts Help (`Ctrl/Cmd + /`)
**Files to Modify:**
- `frontend/src/components/KeyboardShortcuts.jsx`

**Tasks:**
- [ ] Add keyboard shortcut to open modal
- [ ] Update modal with all shortcuts
- [ ] Organize by category
- [ ] Add keyboard navigation within modal
- [ ] Show platform-specific keys (Ctrl vs Cmd)

---

### Phase 2: Navigation Shortcuts (Priority: Medium) - 20 minutes

#### 6. Sidebar Navigation (`1-8`)
**Files to Modify:**
- `frontend/src/components/Layout.jsx`
- `frontend/src/App.jsx`

**Tasks:**
- [ ] Map number keys to sidebar menu items
- [ ] Handle dynamic menu (only active items)
- [ ] Show visual feedback on selection
- [ ] Navigate to selected item
- [ ] Only work when sidebar is visible

**Current Menu Items:**
1. Create Writing (editor)
2. My Writings (library)
3. Browse Amazing Writing (curated)
4. Progress & Stats (progress)
5. Speech Practice (speech)
6. Conversation Practice (practice)
7. Interactive Chat (interactive)
8. Rhetorical Devices (rhetorical)
9. Create Poem (poems)

**Implementation:**
```javascript
// In Layout.jsx or App.jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    // Only handle if not typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const keyMap = {
      '1': 'editor',
      '2': 'library',
      '3': 'curated',
      '4': 'progress',
      '5': 'speech',
      '6': 'practice',
      '7': 'interactive',
      '8': 'rhetorical',
      '9': 'poems',
    };
    
    if (keyMap[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setActiveTab(keyMap[e.key]);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [setActiveTab]);
```

#### 7. Writing Navigation (`Ctrl/Cmd + ←/→`)
**Files to Modify:**
- `frontend/src/components/TextLibrary.jsx`
- `frontend/src/components/TextEditor.jsx`

**Tasks:**
- [ ] Detect if in writing list or detail view
- [ ] Navigate to previous writing (`Ctrl/Cmd + ←`)
- [ ] Navigate to next writing (`Ctrl/Cmd + →`)
- [ ] Only active in relevant views
- [ ] Handle edge cases (first/last writing)

---

### Phase 3: Editor Shortcuts (Priority: Medium) - 15 minutes

#### 8. Text Editor Shortcuts
**Files to Modify:**
- `frontend/src/components/TextEditor.jsx`

**Tasks:**
- [ ] `Tab`: Indent in textarea
- [ ] `Shift + Tab`: Outdent
- [ ] Handle multi-line indentation
- [ ] Preserve selection

**Implementation:**
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Tab' && e.target.tagName === 'TEXTAREA') {
    e.preventDefault();
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    if (e.shiftKey) {
      // Outdent
      // Remove leading tab/space
    } else {
      // Indent
      const selectedText = value.substring(start, end);
      const indentedText = selectedText.split('\n').map(line => '  ' + line).join('\n');
      // Insert indented text
    }
  }
};
```

---

### Phase 4: Polish & Documentation (Priority: Low) - 15 minutes

#### 9. Complete Shortcuts Help Modal
**Files to Modify:**
- `frontend/src/components/KeyboardShortcuts.jsx`

**Tasks:**
- [ ] List ALL implemented shortcuts
- [ ] Organize by category:
  - Global Shortcuts
  - Navigation Shortcuts
  - Editor Shortcuts
  - Media Shortcuts
- [ ] Show platform-specific keys (Ctrl vs Cmd)
- [ ] Add search in shortcuts modal (optional)
- [ ] Keyboard navigation within modal
- [ ] Better visual design

**Updated Shortcuts List:**
```javascript
const shortcuts = [
  // Global
  { category: 'Global', key: 'Ctrl/Cmd + K', description: 'Quick search' },
  { category: 'Global', key: 'Ctrl/Cmd + N', description: 'New writing' },
  { category: 'Global', key: 'Ctrl/Cmd + S', description: 'Save' },
  { category: 'Global', key: 'Ctrl/Cmd + /', description: 'Show shortcuts' },
  { category: 'Global', key: 'Esc', description: 'Close dialogs' },
  
  // Navigation
  { category: 'Navigation', key: '1-9', description: 'Navigate to sidebar items' },
  { category: 'Navigation', key: 'Ctrl/Cmd + ←', description: 'Previous writing' },
  { category: 'Navigation', key: 'Ctrl/Cmd + →', description: 'Next writing' },
  
  // Editor
  { category: 'Editor', key: 'Ctrl/Cmd + Enter', description: 'Generate audio' },
  { category: 'Editor', key: 'Tab', description: 'Indent' },
  { category: 'Editor', key: 'Shift + Tab', description: 'Outdent' },
  
  // Media
  { category: 'Media', key: 'Space', description: 'Play/pause audio' },
];
```

#### 10. Visual Feedback
**Tasks:**
- [ ] Show toast notification on shortcut use (optional)
- [ ] Highlight active shortcut in help modal
- [ ] Add shortcut hints in UI (optional, low priority)

#### 11. Testing
**Tasks:**
- [ ] Test all shortcuts in Chrome
- [ ] Test all shortcuts in Firefox
- [ ] Test all shortcuts in Safari
- [ ] Test on Windows (Ctrl)
- [ ] Test on Mac (Cmd)
- [ ] Test on Linux
- [ ] Verify no conflicts with browser shortcuts
- [ ] Test with screen readers
- [ ] Test keyboard navigation in modals

---

## Integration Points

### Files to Create:
1. `frontend/src/hooks/useGlobalKeyboardShortcuts.js` (NEW)

### Files to Modify:
1. `frontend/src/App.jsx` - Add global shortcuts hook
2. `frontend/src/components/KeyboardShortcuts.jsx` - Complete help modal
3. `frontend/src/components/Layout.jsx` - Add sidebar navigation shortcuts
4. `frontend/src/components/TextEditor.jsx` - Add save shortcut, tab indentation
5. `frontend/src/components/TextLibrary.jsx` - Add writing navigation shortcuts
6. `frontend/src/components/AdvancedSearch.jsx` - Add quick search modal

---

## Success Criteria

- [ ] 10+ keyboard shortcuts implemented
- [ ] All global shortcuts working (`Ctrl/Cmd + K`, `N`, `S`, `/`)
- [ ] Navigation shortcuts working (`1-9`, `←/→`)
- [ ] Editor shortcuts working (`Tab`, `Ctrl/Cmd + Enter`)
- [ ] Shortcuts help modal complete with all shortcuts
- [ ] Visual feedback for shortcuts
- [ ] Cross-browser tested
- [ ] No conflicts with browser shortcuts
- [ ] Accessible (keyboard navigation works)

---

## Estimated Time Breakdown

- Phase 1 (Global Shortcuts): 30 minutes
- Phase 2 (Navigation Shortcuts): 20 minutes
- Phase 3 (Editor Shortcuts): 15 minutes
- Phase 4 (Polish & Testing): 15 minutes
- **Total: ~1.5 hours**

---

## Notes

- Foundation already exists (KeyboardShortcuts component, useKeyboardShortcuts hook)
- Need to expand existing implementation
- Should integrate with existing components
- Must ensure no conflicts with browser shortcuts
- Consider accessibility (keyboard navigation, screen readers)

---

**Status:** Ready for implementation  
**Priority:** High (user efficiency)  
**Dependencies:** None (can be completed independently)

