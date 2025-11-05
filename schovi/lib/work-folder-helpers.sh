#!/bin/bash
# Work Folder Helper Utilities
# These are reference implementations for common operations

# ============================================================================
# CONSTANTS
# ============================================================================

WIP_BASE_DIR=".WIP"

# ============================================================================
# IDENTIFIER GENERATION
# ============================================================================

# Extract Jira ID from text
# Usage: extract_jira_id "text with EC-1234"
# Returns: EC-1234 or empty
extract_jira_id() {
  local text="$1"
  echo "$text" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b' | head -1
}

# Extract GitHub issue number from text or URL
# Usage: extract_github_issue "text with #123" or "github.com/owner/repo/issues/123"
# Returns: 123 or empty
extract_github_issue() {
  local text="$1"
  # Try URL pattern first
  if echo "$text" | grep -qE 'github\.com/.+/(issues|pull)/[0-9]+'; then
    echo "$text" | grep -oE '(issues|pull)/[0-9]+' | grep -oE '[0-9]+' | head -1
  # Try #123 pattern
  elif echo "$text" | grep -qE '#[0-9]+'; then
    echo "$text" | grep -oE '#[0-9]+' | head -1 | tr -d '#'
  # Try owner/repo#123 pattern
  elif echo "$text" | grep -qE '[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+#[0-9]+'; then
    echo "$text" | grep -oE '#[0-9]+' | head -1 | tr -d '#'
  fi
}

# Generate slug from text
# Usage: generate_slug "Add User Authentication with OAuth2"
# Returns: add-user-authentication-with-oauth2
generate_slug() {
  local text="$1"
  echo "$text" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9_-]/-/g' \
    | sed 's/-\+/-/g' \
    | sed 's/^-//; s/-$//' \
    | cut -c1-50 \
    | sed 's/-$//'
}

# Generate work folder identifier
# Usage: generate_identifier "EC-1234 Add user auth" "Add user authentication"
# Returns: EC-1234-add-user-authentication
generate_identifier() {
  local input="$1"
  local description="$2"

  # Try Jira first
  local jira_id=$(extract_jira_id "$input")
  if [ -n "$jira_id" ]; then
    if [ -n "$description" ]; then
      local slug=$(generate_slug "$description")
      echo "${jira_id}-${slug}"
    else
      echo "$jira_id"
    fi
    return
  fi

  # Try GitHub issue
  local gh_issue=$(extract_github_issue "$input")
  if [ -n "$gh_issue" ]; then
    if [ -n "$description" ]; then
      local slug=$(generate_slug "$description")
      echo "GH-${gh_issue}-${slug}"
    else
      echo "GH-${gh_issue}"
    fi
    return
  fi

  # Generate slug from description
  if [ -n "$description" ]; then
    generate_slug "$description"
  else
    generate_slug "$input"
  fi
}

# ============================================================================
# WORK FOLDER OPERATIONS
# ============================================================================

# Check if work folder exists
# Usage: work_folder_exists "EC-1234"
# Returns: 0 if exists, 1 if not
work_folder_exists() {
  local identifier="$1"
  if [ -d "$WIP_BASE_DIR/$identifier" ]; then
    return 0
  fi
  # Also check with glob pattern (e.g., EC-1234*)
  if ls -d "$WIP_BASE_DIR/$identifier"* 2>/dev/null | grep -q .; then
    return 0
  fi
  return 1
}

# Find work folder by identifier (supports partial match)
# Usage: find_work_folder "EC-1234"
# Returns: .WIP/EC-1234-add-user-auth or empty
find_work_folder() {
  local identifier="$1"
  # Exact match first
  if [ -d "$WIP_BASE_DIR/$identifier" ]; then
    echo "$WIP_BASE_DIR/$identifier"
    return
  fi
  # Pattern match (e.g., EC-1234*)
  local folder=$(find "$WIP_BASE_DIR" -maxdepth 1 -type d -name "${identifier}*" | head -1)
  if [ -n "$folder" ]; then
    echo "$folder"
    return
  fi
}

# Create work folder structure
# Usage: create_work_folder "EC-1234-add-user-auth"
# Returns: .WIP/EC-1234-add-user-auth
create_work_folder() {
  local identifier="$1"
  local folder="$WIP_BASE_DIR/$identifier"

  mkdir -p "$folder/context"
  echo "$folder"
}

# List recent work folders
# Usage: list_recent_work_folders 5
# Returns: List of folders sorted by modification time
list_recent_work_folders() {
  local limit="${1:-5}"
  ls -dt "$WIP_BASE_DIR"/*/ 2>/dev/null | head -n "$limit"
}

# ============================================================================
# METADATA OPERATIONS
# ============================================================================

# Get metadata file path
# Usage: get_metadata_path ".WIP/EC-1234"
# Returns: .WIP/EC-1234/.metadata.json
get_metadata_path() {
  local work_folder="$1"
  echo "$work_folder/.metadata.json"
}

# Check if metadata exists
# Usage: metadata_exists ".WIP/EC-1234"
# Returns: 0 if exists, 1 if not
metadata_exists() {
  local work_folder="$1"
  local metadata_file=$(get_metadata_path "$work_folder")
  [ -f "$metadata_file" ]
}

# Read metadata field
# Usage: read_metadata_field ".WIP/EC-1234" ".workflow.current"
# Returns: Field value
read_metadata_field() {
  local work_folder="$1"
  local field="$2"
  local metadata_file=$(get_metadata_path "$work_folder")

  if [ -f "$metadata_file" ]; then
    cat "$metadata_file" | jq -r "$field // empty"
  fi
}

# ============================================================================
# FILE OPERATIONS
# ============================================================================

# Get file path for command output
# Usage: get_output_file_path ".WIP/EC-1234" "analyze"
# Returns: .WIP/EC-1234/02-analysis.md
get_output_file_path() {
  local work_folder="$1"
  local command="$2"

  case "$command" in
    spec)
      echo "$work_folder/01-spec.md"
      ;;
    analyze)
      echo "$work_folder/02-analysis.md"
      ;;
    debug)
      echo "$work_folder/02-debug.md"
      ;;
    plan)
      echo "$work_folder/03-plan.md"
      ;;
    implement)
      echo "$work_folder/04-progress.md"
      ;;
    *)
      echo "$work_folder/$command.md"
      ;;
  esac
}

# Check if output file exists
# Usage: output_file_exists ".WIP/EC-1234" "analyze"
# Returns: 0 if exists, 1 if not
output_file_exists() {
  local work_folder="$1"
  local command="$2"
  local file_path=$(get_output_file_path "$work_folder" "$command")
  [ -f "$file_path" ]
}

# ============================================================================
# GIT OPERATIONS
# ============================================================================

# Extract identifier from git branch name
# Usage: extract_identifier_from_branch "claude/auth-EC-1234-011CUpGnQ1VA"
# Returns: EC-1234
extract_identifier_from_branch() {
  local branch="$1"
  # Try Jira pattern first
  echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]{1,6}' | head -1
}

# Get current git branch
# Usage: get_current_branch
# Returns: branch name
get_current_branch() {
  git rev-parse --abbrev-ref HEAD 2>/dev/null
}

# Auto-detect work folder from git branch
# Usage: detect_work_folder_from_git
# Returns: .WIP/EC-1234-add-user-auth or empty
detect_work_folder_from_git() {
  local branch=$(get_current_branch)
  if [ -z "$branch" ]; then
    return
  fi

  local identifier=$(extract_identifier_from_branch "$branch")
  if [ -n "$identifier" ]; then
    find_work_folder "$identifier"
  fi
}

# ============================================================================
# VALIDATION
# ============================================================================

# Validate workflow step
# Usage: validate_workflow_step ".WIP/EC-1234" "plan" "analyze"
# Returns: 0 if valid, 1 if invalid
validate_workflow_step() {
  local work_folder="$1"
  local current_command="$2"
  local required_previous="$3"

  if [ -z "$required_previous" ]; then
    return 0
  fi

  local completed=$(read_metadata_field "$work_folder" ".workflow.completed[]")
  if echo "$completed" | grep -q "$required_previous"; then
    return 0
  fi

  return 1
}

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

# Example 1: Create new work folder for Jira issue
example_create_from_jira() {
  local input="EC-1234"
  local title="Add user authentication"

  # Generate identifier
  local identifier=$(generate_identifier "$input" "$title")
  echo "Identifier: $identifier"  # EC-1234-add-user-authentication

  # Create work folder
  local work_folder=$(create_work_folder "$identifier")
  echo "Work folder: $work_folder"  # .WIP/EC-1234-add-user-authentication
}

# Example 2: Find existing work folder
example_find_existing() {
  local input="EC-1234"

  # Find work folder
  local work_folder=$(find_work_folder "$input")
  if [ -n "$work_folder" ]; then
    echo "Found: $work_folder"

    # Read metadata
    if metadata_exists "$work_folder"; then
      local current=$(read_metadata_field "$work_folder" ".workflow.current")
      echo "Current step: $current"
    fi
  else
    echo "Work folder not found"
  fi
}

# Example 3: Auto-detect from git branch
example_auto_detect() {
  local work_folder=$(detect_work_folder_from_git)
  if [ -n "$work_folder" ]; then
    echo "Detected work folder: $work_folder"
  else
    echo "No work folder detected from git branch"
  fi
}

# Example 4: Get output file path
example_get_output_path() {
  local work_folder=".WIP/EC-1234-add-user-auth"
  local command="analyze"

  local file_path=$(get_output_file_path "$work_folder" "$command")
  echo "Output will be written to: $file_path"  # .WIP/EC-1234-add-user-auth/02-analysis.md
}
