#!/bin/bash
# Docker and Docker Compose installation script for Ubuntu/Debian systems
curl -fsSL https://get.docker.com -o install-docker.sh && sudo sh install-docker.sh || exit 1

# get latest docker compose released tag
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)

# Install docker-compose
sh -c "curl -L https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose"
chmod +x /usr/local/bin/docker-compose
sh -c "curl -L https://raw.githubusercontent.com/docker/compose/${COMPOSE_VERSION}/contrib/completion/bash/docker-compose > /etc/bash_completion.d/docker-compose"

# Output compose version
docker-compose -v

exit 0