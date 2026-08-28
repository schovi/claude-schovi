#!/usr/bin/env bash
# codex-delegate.sh - run `codex exec` non-interactively and print only the final message.
#
# Usage:
#   codex-delegate.sh [-m MODEL] [-e EFFORT] [-s SANDBOX] [-C DIR] [-r SESSION_ID] [-x MARKERS] [PROMPT]
#
#   PROMPT       task prompt; use '-' (or omit) to read it from stdin (heredoc-friendly)
#   -m MODEL     gpt-5.6-luna | gpt-5.6-terra (default) | gpt-5.6-sol
#   -e EFFORT    low | medium (default) | high | xhigh | max
#   -s SANDBOX   read-only | workspace-write (default) | danger-full-access
#   -C DIR       working root for the agent (ignored with -r; resumed sessions keep theirs)
#   -r SESSION   resume an earlier session by id; send only the delta instruction
#   -x MARKERS   comma-separated literal strings that must appear in the final message
#                (contract check); a miss prints 'contract: missing: ...' and exits 3
#
# Prints a header (session id, log path, contract verdict with -x), then '---', then
# the final message. The full event stream (reasoning, tool calls) is kept in the log
# file for inspection. On failure the log tail goes to stderr and the codex exit code
# is propagated.

set -u

model="gpt-5.6-terra"
effort="medium"
sandbox="workspace-write"
workdir=""
resume_id=""
markers=""

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

while getopts ":m:e:s:C:r:x:h" opt; do
  case "$opt" in
    m) model="$OPTARG" ;;
    e) effort="$OPTARG" ;;
    s) sandbox="$OPTARG" ;;
    C) workdir="$OPTARG" ;;
    r) resume_id="$OPTARG" ;;
    x) markers="$OPTARG" ;;
    h | *) usage ;;
  esac
done
shift $((OPTIND - 1))

prompt="${1:--}"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI not found; install it or fall back to native subagents" >&2
  exit 127
fi

log_dir="${CODEX_DELEGATE_LOG_DIR:-$HOME/.cache/codex-delegate}"
mkdir -p "$log_dir"
stamp="$(date +%Y%m%d-%H%M%S)-$$"
log_file="$log_dir/$stamp.log"
out_file="$log_dir/$stamp.last-message.txt"

common=(-m "$model" -c "model_reasoning_effort=\"$effort\"" -o "$out_file" --skip-git-repo-check)

if [[ -n "$resume_id" ]]; then
  cmd=(codex exec resume "${common[@]}" "$resume_id" "$prompt")
else
  cmd=(codex exec "${common[@]}" -s "$sandbox")
  [[ -n "$workdir" ]] && cmd+=(-C "$workdir")
  cmd+=("$prompt")
fi

if [[ "$prompt" == "-" ]]; then
  "${cmd[@]}" >/dev/null 2>"$log_file"
else
  "${cmd[@]}" >/dev/null 2>"$log_file" </dev/null
fi
status=$?

session_id="$(sed -n 's/^session id: //p' "$log_file" | head -1)"
echo "session: ${session_id:-unknown} (follow up: codex-delegate.sh -r <session> \"...\")"
echo "log: $log_file"

if [[ $status -ne 0 ]]; then
  echo "codex exec failed with exit $status; log tail:" >&2
  tail -40 "$log_file" >&2
  exit $status
fi

if [[ ! -s "$out_file" ]]; then
  echo "codex produced no final message; inspect $log_file" >&2
  exit 1
fi

contract_status=0
if [[ -n "$markers" ]]; then
  missing=()
  IFS=',' read -r -a marker_list <<<"$markers"
  for marker in "${marker_list[@]}"; do
    [[ -z "$marker" ]] && continue
    grep -qF -- "$marker" "$out_file" || missing+=("$marker")
  done
  if ((${#missing[@]})); then
    echo "contract: missing: $(printf '%s | ' "${missing[@]}" | sed 's/ | $//')"
    contract_status=3
  else
    echo "contract: ok"
  fi
fi

echo "---"
cat "$out_file"
echo
exit $contract_status
