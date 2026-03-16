#!/usr/bin/env bash

set -euo pipefail

HOST="${OPENCLAW_HOST:-mac@10.10.1.9}"
DB_PATH="${OPENCLAW_DB_PATH:-/Users/mac/.openclaw/memory/main.sqlite}"
LOG_PATH="${OPENCLAW_LOG_PATH:-/Users/mac/.openclaw/logs/gateway.log}"
REFRESH_SECONDS="${OPENCLAW_WATCH_INTERVAL:-1}"
RENDER_MODE="${OPENCLAW_WATCH_RENDER:-stream}"

usage() {
  cat <<'EOF'
Usage:
  scripts/openclaw-memory-watch.sh overview
  scripts/openclaw-memory-watch.sh logs
  scripts/openclaw-memory-watch.sh logs-raw
  scripts/openclaw-memory-watch.sh facts
  scripts/openclaw-memory-watch.sh topics
  scripts/openclaw-memory-watch.sh cache
  scripts/openclaw-memory-watch.sh wal
  scripts/openclaw-memory-watch.sh handles
  scripts/openclaw-memory-watch.sh pid

Environment overrides:
  OPENCLAW_HOST            SSH target, default: mac@10.10.1.9
  OPENCLAW_DB_PATH         Remote SQLite path
  OPENCLAW_LOG_PATH        Remote gateway log path
  OPENCLAW_WATCH_INTERVAL  Refresh interval in seconds, default: 1
  OPENCLAW_WATCH_RENDER    redraw or stream, default: stream

Suggested usage:
  1. Terminal A: scripts/openclaw-memory-watch.sh logs
  2. Terminal B: scripts/openclaw-memory-watch.sh facts
  3. Terminal C: scripts/openclaw-memory-watch.sh topics
  4. Terminal D: scripts/openclaw-memory-watch.sh cache
EOF
}

run_ssh() {
  ssh "$HOST" "$@"
}

watch_loop() {
  local body="$1"
  while true; do
    if [ "$RENDER_MODE" = "stream" ]; then
      printf '\n===== %s =====\n' "$(date '+%F %T')"
    else
      printf '\033[H\033[J'
    fi
    run_ssh "$body"
    sleep "$REFRESH_SECONDS"
  done
}

pid_command() {
  run_ssh "pgrep -fal openclaw-gateway || true"
}

logs_command() {
  run_ssh "tail -f '$LOG_PATH' | egrep --line-buffered 'bamdra|memory_|context-engine|sqlite|fact|topic|tool|register|disabled|error|warn' || true"
}

logs_raw_command() {
  run_ssh "tail -f '$LOG_PATH'"
}

facts_command() {
  watch_loop "
    echo '== facts =='
    date '+%F %T'
    echo
    echo '-- count --'
    sqlite3 -header -column '$DB_PATH' \"select count(*) as facts from facts;\" 2>&1
    echo
    echo '-- latest rows --'
    sqlite3 -header -column '$DB_PATH' \"
      select id, scope, key, value, updated_at
      from facts
      order by updated_at desc
      limit 12;
    \" 2>&1
  "
}

topics_command() {
  watch_loop "
    echo '== topics =='
    date '+%F %T'
    echo
    echo '-- count --'
    sqlite3 -header -column '$DB_PATH' \"select count(*) as topics from topics;\" 2>&1
    echo
    echo '-- latest rows --'
    sqlite3 -header -column '$DB_PATH' \"
      select id, session_id, title, status, last_active_at
      from topics
      order by last_active_at desc
      limit 12;
    \" 2>&1
  "
}

cache_command() {
  watch_loop "
    PID=\$(pgrep -fo openclaw-gateway || true)
    echo '== cache and process memory =='
    date '+%F %T'
    echo
    echo '-- gateway process --'
    if [ -n \"\$PID\" ]; then
      ps -p \"\$PID\" -o pid=,rss=,%mem=,etime=,command=
    else
      echo 'openclaw-gateway not running'
    fi
    echo
    echo '-- session_state rows --'
    sqlite3 -header -column '$DB_PATH' \"
      select session_id, active_topic_id, last_turn_id, updated_at
      from session_state
      order by updated_at desc
      limit 12;
    \" 2>&1
    echo
    echo '-- messages count --'
    sqlite3 -header -column '$DB_PATH' \"
      select count(*) as messages from messages;
    \" 2>&1
  "
}

wal_command() {
  watch_loop "
    echo '== sqlite files =='
    date '+%F %T'
    for f in '$DB_PATH' '$DB_PATH-wal' '$DB_PATH-shm'; do
      if [ -e \"\$f\" ]; then
        ls -ln \"\$f\"
        stat -f 'size=%z bytes mtime=%Sm' -t '%F %T' \"\$f\"
      else
        echo \"missing: \$f\"
      fi
      echo
    done
  "
}

handles_command() {
  local pid
  pid="$(run_ssh "pgrep -fo openclaw-gateway || true")"
  if [ -z "$pid" ]; then
    echo "openclaw-gateway process not found on $HOST" >&2
    exit 1
  fi
  run_ssh "echo '== pid ==' && echo '$pid' && echo && lsof -p '$pid' | egrep 'main.sqlite|main.sqlite-wal|main.sqlite-shm' || true"
}

overview_command() {
  watch_loop "
    PID=\$(pgrep -fo openclaw-gateway || true)
    echo '== gateway =='
    date '+%F %T'
    if [ -n \"\$PID\" ]; then
      ps -p \"\$PID\" -o pid=,ppid=,etime=,command=
    else
      echo 'openclaw-gateway not running'
    fi
    echo

    echo '== sqlite files =='
    for f in '$DB_PATH' '$DB_PATH-wal' '$DB_PATH-shm'; do
      if [ -e \"\$f\" ]; then
        stat -f '%N size=%z mtime=%Sm' -t '%F %T' \"\$f\"
      else
        echo \"missing: \$f\"
      fi
    done
    echo

    echo '== latest facts =='
    sqlite3 -header -column '$DB_PATH' \"
      select id, scope, key, value, updated_at
      from facts
      order by updated_at desc
      limit 8;
    \" 2>&1
    echo

    echo '== latest topics =='
    sqlite3 -header -column '$DB_PATH' \"
      select id, session_id, title, status, last_active_at
      from topics
      order by last_active_at desc
      limit 8;
    \" 2>&1
    echo

    echo '== cache and process memory =='
    if [ -n \"\$PID\" ]; then
      ps -p \"\$PID\" -o pid=,rss=,%mem=,etime=,command=
    else
      echo 'openclaw-gateway not running'
    fi
    sqlite3 -header -column '$DB_PATH' \"
      select session_id, active_topic_id, last_turn_id, updated_at
      from session_state
      order by updated_at desc
      limit 5;
    \" 2>&1
    echo

    echo '== recent memory logs =='
    tail -n 40 '$LOG_PATH' | egrep 'bamdra|memory_|context-engine|sqlite|fact|topic|tool|register|disabled|error|warn' || true
  "
}

main() {
  local mode="${1:-overview}"
  case "$mode" in
    overview) overview_command ;;
    logs) logs_command ;;
    logs-raw) logs_raw_command ;;
    facts) facts_command ;;
    topics) topics_command ;;
    cache) cache_command ;;
    wal) wal_command ;;
    handles) handles_command ;;
    pid) pid_command ;;
    -h|--help|help) usage ;;
    *)
      echo "Unknown mode: $mode" >&2
      echo >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
