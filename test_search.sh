#!/bin/bash
# Standalone CLI for testing search functionality in the jl_browser_skill chatbot script.
# Usage: ./test_search.sh <search_query>
# Example: ./test_search.sh 电器

if [ -z "$1" ]; then
    echo "Usage: ./test_search.sh <search_query>"
    exit 1
fi

USER_ID="debug_user"
CMD_CODE="se"
USER_TEXT="$1"

SCRIPT_PATH="/Users/jackylee/aimv/agents/jl_browser_skill/cli_chatbot.py"

echo "=========================================="
echo "Running search for: $USER_TEXT"
echo "=========================================="
python3 "$SCRIPT_PATH" "$USER_ID" "$CMD_CODE" "$USER_TEXT"
echo ""
echo "=========================================="
