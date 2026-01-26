#!/bin/bash
# Notification handler for Claude hooks
# Usage: notify.sh <event_type>

EVENT_TYPE="${1:-stop}"
INPUT=$(cat)

CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
PROJECT=$(basename "${CWD:-Unknown}")

case "$EVENT_TYPE" in
  "notification")
    TITLE="Input Required"
    MESSAGE="Claude needs your input"
    SOUND="Ping"
    ;;
  "stop")
    TITLE="Task Complete"
    MESSAGE="$PROJECT"
    SOUND="Glass"
    ;;
esac

terminal-notifier \
  -title "$TITLE" \
  -subtitle "$PROJECT" \
  -message "$MESSAGE" \
  -sound "$SOUND" \
  -group "ClaudeCode-$EVENT_TYPE"
