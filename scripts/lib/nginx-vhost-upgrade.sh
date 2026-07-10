#!/bin/bash
# Shared helpers for regenerating domain nginx vhosts (VM update + Docker entrypoint).
# Expects optional log() and warn() from the caller; falls back to echo.

_nginx_vhost_log() {
    if declare -F log &>/dev/null; then
        log "$@"
    else
        echo "$@"
    fi
}

_nginx_vhost_warn() {
    if declare -F warn &>/dev/null; then
        warn "$@"
    else
        echo "WARN: $*" >&2
    fi
}

# True when bundled nginx.conf expects JA4 but an SSL vhost still lacks `ja4 on;`.
nginx_vhosts_need_ja4_regeneration() {
    local project_dir="$1"
    local config_file="${project_dir}/config/nginx.conf"

    if [ ! -f "${config_file}" ] || ! grep -q 'ja4_module' "${config_file}"; then
        return 1
    fi

    local site
    for site in /etc/nginx/sites-enabled/*.conf; do
        [ -f "${site}" ] || continue
        if grep -qE 'listen\s+443\s+ssl' "${site}" && ! grep -q 'ja4 on' "${site}"; then
            return 0
        fi
    done

    return 1
}

# Load DATABASE_URL from apps/api/.env when not already in the environment (VM path).
_load_backend_database_url() {
    local backend_dir="$1"

    if [ -n "${DATABASE_URL:-}" ]; then
        return 0
    fi

    if [ ! -f "${backend_dir}/.env" ]; then
        return 1
    fi

    set -a
    # shellcheck disable=SC1090
    source "${backend_dir}/.env"
    set +a

    [ -n "${DATABASE_URL:-}" ]
}

# Rewrite all domain vhosts from the database (JA4, Bot Manager, SSL, etc.).
regenerate_domain_nginx_configs() {
    local project_dir="$1"
    local log_file="${2:-/dev/null}"
    local backend_dir="${project_dir}/apps/api"
    local script_js="${backend_dir}/dist/scripts/regenerate-domain-configs.js"

    if [ ! -f "${script_js}" ]; then
        _nginx_vhost_warn "Regenerate script not found (${script_js}); rebuild backend first"
        return 1
    fi

    if ! _load_backend_database_url "${backend_dir}"; then
        _nginx_vhost_warn "DATABASE_URL not set and no ${backend_dir}/.env; skipping domain nginx config regeneration"
        return 1
    fi

    _nginx_vhost_log "Regenerating domain vhost configs from database..."
    if (cd "${backend_dir}" && node dist/scripts/regenerate-domain-configs.js) >> "${log_file}" 2>&1; then
        _nginx_vhost_log "✓ Domain vhost configs regenerated"
        return 0
    fi

    _nginx_vhost_warn "Failed to regenerate domain vhost configs (see ${log_file})"
    return 1
}
