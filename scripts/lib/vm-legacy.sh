#!/bin/bash
# Shared helpers for legacy VM deploy/update (not used by Docker Compose path).

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
