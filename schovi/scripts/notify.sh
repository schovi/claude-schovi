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
    SUBTITLE="$PROJECT"
    MESSAGE="Claude needs your input"
    SOUND="Ping"
    ;;
  "stop")
    TITLE="Task Complete"
    SUBTITLE=""
    MESSAGE="$PROJECT"
    SOUND="Glass"
    ;;
esac

ARGS=(
  -title "$TITLE"
  -message "$MESSAGE"
  -sound "$SOUND"
  -group "ClaudeCode-${CWD:-default}"
)

[ -n "$SUBTITLE" ] && ARGS+=(-subtitle "$SUBTITLE")

terminal-notifier "${ARGS[@]}"
