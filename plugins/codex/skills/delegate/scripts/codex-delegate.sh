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
#   -C DIR       working root for the agent, and its writable root under workspace-write
#   -r SESSION   resume an earlier session by id; send only the delta instruction
#   -x MARKERS   comma-separated literal strings that must appear in the final message
#                (contract check); a miss prints 'contract: missing: ...' and exits 3
#
# Resume takes its workspace from the calling process's cwd and accepts no -C/-s of its own,
# so this wrapper re-enters the resumed session's recorded cwd and replays its model, effort
# and sandbox. Any of -C/-m/-e/-s you pass with -r overrides that inherited value.
#
# Prints a header (session id, log path, effective context, contract verdict with -x), then
# '---', then the final message. The full event stream (reasoning, tool calls) is kept in the
# log file for inspection. On failure the log tail goes to stderr and the codex exit code is
# propagated.

set -u

model="gpt-5.6-terra"
effort="medium"
sandbox="workspace-write"
workdir=""
resume_id=""
markers=""
model_given=""
effort_given=""
sandbox_given=""

usage() {
  sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

while getopts ":m:e:s:C:r:x:h" opt; do
  case "$opt" in
    m) model="$OPTARG" model_given=1 ;;
    e) effort="$OPTARG" effort_given=1 ;;
    s) sandbox="$OPTARG" sandbox_given=1 ;;
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

# Reads a recorded session's own settings so a resume can be replayed in the workspace it was
# created in: origin cwd from session_meta, model/effort/sandbox from its first turn context.
# Prints "cwd<TAB>model<TAB>effort<TAB>sandbox"; non-zero when the rollout can't be read.
recorded_session_settings() {
  local session="$1" home="${CODEX_HOME:-$HOME/.codex}" roots=() rollout
  [[ -d "$home/sessions" ]] && roots+=("$home/sessions")
  [[ -d "$home/archived_sessions" ]] && roots+=("$home/archived_sessions")
  ((${#roots[@]})) || return 1
  rollout="$(find "${roots[@]}" -name "rollout-*-$session.jsonl" -print -quit 2>/dev/null)"
  [[ -n "$rollout" ]] || return 1
  command -v python3 >/dev/null 2>&1 || return 1
  python3 - "$rollout" <<'PY'
import json, sys

cwd = model = effort = sandbox = ""
with open(sys.argv[1], errors="replace") as rollout:
    for line in rollout:
        try:
            entry = json.loads(line)
        except ValueError:
            continue
        payload = entry.get("payload") or {}
        kind = entry.get("type")
        if kind == "session_meta":
            cwd = payload.get("cwd") or cwd
        elif kind == "turn_context":
            cwd = cwd or payload.get("cwd") or ""
            model = payload.get("model") or ""
            effort = payload.get("effort") or payload.get("model_reasoning_effort") or ""
            sandbox = (payload.get("sandbox_policy") or {}).get("type") or ""
            break
print("\t".join([cwd, model, effort, sandbox]))
PY
}

log_dir="${CODEX_DELEGATE_LOG_DIR:-$HOME/.cache/codex-delegate}"
mkdir -p "$log_dir"
stamp="$(date +%Y%m%d-%H%M%S)-$$"
log_file="$log_dir/$stamp.log"
out_file="$log_dir/$stamp.last-message.txt"

if [[ -n "$resume_id" ]]; then
  if settings="$(recorded_session_settings "$resume_id")"; then
    IFS=$'\t' read -r rec_cwd rec_model rec_effort rec_sandbox <<<"$settings"
    [[ -n "$workdir" ]] || workdir="$rec_cwd"
    [[ -n "$model_given" || -z "$rec_model" ]] || model="$rec_model"
    [[ -n "$effort_given" || -z "$rec_effort" ]] || effort="$rec_effort"
    [[ -n "$sandbox_given" || -z "$rec_sandbox" ]] || sandbox="$rec_sandbox"
  else
    echo "warning: no rollout found for session $resume_id; resuming in $PWD" >&2
  fi
  if [[ -n "$workdir" ]] && ! cd "$workdir"; then
    echo "cannot enter workdir $workdir for resume" >&2
    exit 1
  fi
  # resume has no -s; sandbox_mode is the config-level equivalent
  cmd=(codex exec resume -m "$model" -c "model_reasoning_effort=\"$effort\"" \
    -c "sandbox_mode=\"$sandbox\"" -o "$out_file" --skip-git-repo-check "$resume_id" "$prompt")
else
  cmd=(codex exec -m "$model" -c "model_reasoning_effort=\"$effort\"" -o "$out_file" \
    --skip-git-repo-check -s "$sandbox")
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

# Echoed from codex's own banner, so a wrong workspace or a drifted model shows up here rather
# than as an unexplained "patch rejected" inside the final message.
ran_model="$(sed -n 's/^model: //p' "$log_file" | head -1)"
ran_effort="$(sed -n 's/^reasoning effort: //p' "$log_file" | head -1)"
ran_sandbox="$(sed -n 's/^sandbox: //p' "$log_file" | head -1 | awk '{print $1}')"
ran_workdir="$(sed -n 's/^workdir: //p' "$log_file" | head -1)"
[[ -n "$ran_workdir" ]] && echo "context: ${ran_model:-?} / ${ran_effort:-?} / ${ran_sandbox:-?} in $ran_workdir"

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
