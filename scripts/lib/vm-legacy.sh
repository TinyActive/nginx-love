#!/bin/bash
# Shared helpers for legacy VM deploy/update (not used by Docker Compose path).

NGINX_INSTALL_SCRIPT_NAME="install-nginx-modsecurity.sh"

# Expected nginx version from scripts/install-nginx-modsecurity.sh (single source of truth).
get_expected_nginx_version() {
    local install_script="$1"
    sed -n 's/^NGINX_VERSION="\(.*\)"/\1/p' "${install_script}" | head -n1
}

# Module paths declared via load_module in the project nginx.conf template.
nginx_required_modules() {
    local project_dir="$1"
    local config_file="${project_dir}/config/nginx.conf"
    if [ ! -f "${config_file}" ]; then
        return 0
    fi
    grep -E '^\s*load_module\s+' "${config_file}" \
        | sed -E 's/^\s*load_module\s+([^;]+);/\1/' \
        | tr -d ' '
}

# True when nginx binary/modules are behind the bundled core (e.g. missing JA4 after branch upgrade).
nginx_needs_core_upgrade() {
    local project_dir="$1"
    local install_script="${project_dir}/scripts/${NGINX_INSTALL_SCRIPT_NAME}"

    if [ ! -f "${install_script}" ]; then
        return 1
    fi

    if ! command -v nginx &>/dev/null; then
        return 0
    fi

    local expected_version
    expected_version="$(get_expected_nginx_version "${install_script}")"
    local current_version
    current_version="$(nginx -v 2>&1 | sed -n 's/.*nginx\/\([^ ]*\).*/\1/p')"

    if [ -n "${expected_version}" ] && [ "${current_version}" != "${expected_version}" ]; then
        return 0
    fi

    local module_path
    while IFS= read -r module_path; do
        [ -z "${module_path}" ] && continue
        if [ ! -f "${module_path}" ]; then
            return 0
        fi
    done < <(nginx_required_modules "${project_dir}")

    return 1
}

# Rebuild nginx + dynamic modules from source; preserve /etc/nginx site configs and ModSecurity rules.
upgrade_nginx_core() {
    local project_dir="$1"
    local log_file="${2:-/dev/null}"
    local install_script="${project_dir}/scripts/${NGINX_INSTALL_SCRIPT_NAME}"

    if systemctl is-active --quiet nginx 2>/dev/null; then
        systemctl stop nginx >> "${log_file}" 2>&1 || true
    fi

    bash "${install_script}" --upgrade >> "${log_file}" 2>&1
}

# Build @nginx-love/shared then compile API — avoids pnpm --filter from apps/api cwd.
build_vm_backend() {
    local project_dir="$1"
    local log_file="${2:-/dev/null}"

    cd "${project_dir}"
    pnpm --filter @nginx-love/shared build >> "${log_file}" 2>&1 \
        || return 1
    pnpm --filter @nginx-love/api exec tsc >> "${log_file}" 2>&1 \
        || return 1
}

# nginx on :8080 serves dist/ and proxies /api -> localhost:3001 (same as Docker frontend).
install_vm_frontend_nginx() {
    local project_dir="$1"
    local log_file="${2:-/dev/null}"

    sed "s|{{PROJECT_DIR}}|${project_dir}|g" \
        "${project_dir}/config/nginx-frontend-vm.conf" \
        > /etc/nginx/nginx-love-frontend.conf

    sed "s|{{PROJECT_DIR}}|${project_dir}|g" \
        "${project_dir}/deploy/systemd/nginx-love-frontend.service" \
        > /etc/systemd/system/nginx-love-frontend.service

    systemctl daemon-reload >> "${log_file}" 2>&1
}
