#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCH_SCRIPT="$SCRIPT_DIR/openclaw-memory-watch.sh"
SESSION_NAME="${OPENCLAW_WATCH_SESSION:-openclaw-memory-watch}"

usage() {
  cat <<'EOF'
Usage:
  scripts/openclaw-memory-watch-session.sh
  scripts/openclaw-memory-watch-session.sh --print
  scripts/openclaw-memory-watch-session.sh --kill

Behavior:
  - Default: create a tmux session with 4 panes for memory monitoring.
  - --print: print the four monitoring commands without launching tmux.
  - --kill: stop the tmux session created by this script.

Environment overrides:
  OPENCLAW_WATCH_SESSION   tmux session name, default: openclaw-memory-watch
  OPENCLAW_HOST            forwarded to openclaw-memory-watch.sh
  OPENCLAW_DB_PATH         forwarded to openclaw-memory-watch.sh
  OPENCLAW_LOG_PATH        forwarded to openclaw-memory-watch.sh
  OPENCLAW_WATCH_INTERVAL  forwarded to openclaw-memory-watch.sh
EOF
}

print_commands() {
  cat <<EOF
bash "$WATCH_SCRIPT" logs-raw
bash "$WATCH_SCRIPT" facts
bash "$WATCH_SCRIPT" topics
bash "$WATCH_SCRIPT" cache
EOF
}

ensure_tmux() {
  if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux not found. Run these commands in separate terminals:" >&2
    print_commands
    exit 0
  fi
}

kill_session() {
  if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux kill-session -t "$SESSION_NAME"
    echo "Killed tmux session: $SESSION_NAME"
  else
    echo "No tmux session named $SESSION_NAME"
  fi
}

start_session() {
  ensure_tmux

  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "tmux session already exists: $SESSION_NAME"
    exec tmux attach -t "$SESSION_NAME"
  fi

  tmux new-session -d -s "$SESSION_NAME" -n monitor "bash '$WATCH_SCRIPT' logs-raw"
  tmux set-option -t "$SESSION_NAME" mouse on >/dev/null
  tmux set-option -t "$SESSION_NAME" set-clipboard on >/dev/null 2>&1 || true
  tmux set-window-option -t "$SESSION_NAME:monitor" pane-border-status top >/dev/null
  local logs_pane facts_pane
  logs_pane="$(tmux display-message -p -t "$SESSION_NAME:monitor" '#{pane_id}')"
  facts_pane="$(tmux split-window -h -P -F '#{pane_id}' -t "$logs_pane" "bash '$WATCH_SCRIPT' facts")"
  local topics_pane cache_pane
  topics_pane="$(tmux split-window -v -P -F '#{pane_id}' -t "$logs_pane" "bash '$WATCH_SCRIPT' topics")"
  cache_pane="$(tmux split-window -v -P -F '#{pane_id}' -t "$facts_pane" "bash '$WATCH_SCRIPT' cache")"
  tmux select-layout -t "$SESSION_NAME" tiled >/dev/null
  tmux select-pane -t "$logs_pane" -T "logs-raw" >/dev/null
  tmux select-pane -t "$facts_pane" -T "facts" >/dev/null
  tmux select-pane -t "$topics_pane" -T "topics" >/dev/null
  tmux select-pane -t "$cache_pane" -T "cache" >/dev/null

  echo "Started tmux session: $SESSION_NAME"
  echo "Attach with: tmux attach -t $SESSION_NAME"
  echo "Stop with:   bash $0 --kill"
}

main() {
  case "${1:-}" in
    "")
      start_session
      ;;
    --print)
      print_commands
      ;;
    --kill)
      kill_session
      ;;
    -h|--help|help)
      usage
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
