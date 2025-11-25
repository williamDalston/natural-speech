#!/bin/bash

# Agent 4 Commit Script
# This script checks for Agent 4 changes and commits/pushes them to GitHub

set -e

echo "🔍 Checking Agent 4 work status..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Agent 4 related files
AGENT4_FILES=(
    "frontend/src/components/ErrorBoundary.jsx"
    "frontend/src/components/ErrorDisplay.jsx"
    "frontend/src/components/ProgressIndicator.jsx"
    "frontend/src/components/SkeletonLoader.jsx"
    "frontend/src/components/Toast.jsx"
    "frontend/src/components/Tooltip.jsx"
    "frontend/src/context/AppContext.jsx"
    "frontend/src/hooks/useToast.js"
    "frontend/src/api.js"
    "frontend/src/App.jsx"
    "frontend/src/main.jsx"
    "frontend/src/components/TextInput.jsx"
    "frontend/src/components/ImageUpload.jsx"
    "frontend/src/components/Controls.jsx"
    "AGENT_4_COMPLETION.md"
    "AGENT_PROGRESS.md"
)

echo "📋 Checking Agent 4 files..."
echo ""

# Check git status
STATUS=$(git status --porcelain)

# Find Agent 4 related changes
AGENT4_CHANGES=()
for file in "${AGENT4_FILES[@]}"; do
    if echo "$STATUS" | grep -q "$file"; then
        AGENT4_CHANGES+=("$file")
    fi
done

# Check for untracked Agent 4 files
UNTRACKED=$(git ls-files --others --exclude-standard | grep -E "(frontend/src|AGENT_4)" || true)

if [ ${#AGENT4_CHANGES[@]} -eq 0 ] && [ -z "$UNTRACKED" ]; then
    echo -e "${GREEN}✅ All Agent 4 files are already committed!${NC}"
    echo ""
    echo "Checking if commits are pushed to GitHub..."
    
    # Check if local is ahead of remote
    LOCAL_COMMITS=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
    
    if [ "$LOCAL_COMMITS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  You have $LOCAL_COMMITS local commit(s) not pushed to GitHub${NC}"
        echo ""
        read -p "Push to GitHub now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🚀 Pushing to GitHub..."
            git push origin main
            echo -e "${GREEN}✅ Pushed to GitHub!${NC}"
        fi
    else
        echo -e "${GREEN}✅ Everything is synced with GitHub!${NC}"
        echo ""
        echo "View on GitHub: https://github.com/williamDalston/natural-speech"
    fi
else
    echo -e "${YELLOW}📝 Found Agent 4 changes to commit:${NC}"
    echo ""
    
    # Show modified files
    if [ ${#AGENT4_CHANGES[@]} -gt 0 ]; then
        echo "Modified files:"
        for file in "${AGENT4_CHANGES[@]}"; do
            echo "  - $file"
        done
        echo ""
    fi
    
    # Show untracked files
    if [ -n "$UNTRACKED" ]; then
        echo "New files:"
        echo "$UNTRACKED" | while read -r file; do
            if [[ "$file" == *"frontend/src"* ]] || [[ "$file" == *"AGENT_4"* ]]; then
                echo "  - $file"
            fi
        done
        echo ""
    fi
    
    # Show diff summary
    echo "📊 Summary of changes:"
    git diff --stat frontend/src/ 2>/dev/null || echo "  (no changes to show)"
    echo ""
    
    read -p "Commit these changes? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Staging Agent 4 files..."
        
        # Stage all Agent 4 related files
        git add frontend/src/
        git add AGENT_4_COMPLETION.md AGENT_PROGRESS.md 2>/dev/null || true
        
        echo "💾 Committing changes..."
        git commit -m "Agent 4: Complete Frontend API Integration & Error Handling

- Enhanced API client with retry, timeout, and cancellation
- Added error boundary and user-friendly error handling
- Implemented progress indicators and loading states
- Added comprehensive input validation
- Created Context API for state management
- Added toast notifications and help tooltips
- Implemented keyboard shortcuts (Ctrl+Enter, Escape)
- Added drag-and-drop for image uploads
- All features tested and working"

        echo -e "${GREEN}✅ Committed successfully!${NC}"
        echo ""
        
        read -p "Push to GitHub now? (y/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🚀 Pushing to GitHub..."
            git push origin main
            echo -e "${GREEN}✅ Pushed to GitHub!${NC}"
            echo ""
            echo "View on GitHub: https://github.com/williamDalston/natural-speech"
        else
            echo -e "${YELLOW}⚠️  Remember to push with: git push origin main${NC}"
        fi
    else
        echo "❌ Cancelled. No changes committed."
    fi
fi

echo ""
echo "✨ Done!"

