FROM node:20-bullseye

# Install systemd and system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    systemd \
    systemd-sysv \
    git \
    curl \
    wget \
    ca-certificates \
    zsh \
    sudo \
    openssl \
    postgresql-client \
    # Install nginx
    nginx \
    nginx-extras \
    # For better terminal experience
    vim \
    nano \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Configure systemd
RUN systemctl enable nginx

# Install pnpm globally
RUN npm install -g pnpm@8.15.0

# Configure nginx directories and permissions for node user
RUN mkdir -p /var/log/nginx /etc/nginx/ssl /var/www/html/.well-known/acme-challenge /etc/nginx/snippets /run/nginx \
    && chmod -R 777 /var/log/nginx /etc/nginx/ssl /var/www/html/.well-known /etc/nginx/snippets /run/nginx \
    && chown -R node:node /var/log/nginx /etc/nginx/ssl /var/www/html /etc/nginx/snippets /run/nginx

# Configure sudo for node user
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install Oh My Zsh for node user
USER node
RUN sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Switch back to root to configure zsh as default shell
USER root
RUN chsh -s /usr/bin/zsh node

# Set up node user and workspace
USER node
WORKDIR /workspace

# Configure git safe directory
RUN git config --global --add safe.directory /workspace

# Set default shell to zsh
ENV SHELL=/usr/bin/zsh

CMD ["/usr/bin/zsh"]
