.PHONY: base backend web frontend all up down logs pull-up

IMAGE_TAG ?= local
BASE_IMAGE ?= nginx-love-base:$(IMAGE_TAG)

base:
	docker build -f docker/Dockerfile.base.nginx -t nginx-love-base:$(IMAGE_TAG) .

backend: base
	docker build -f docker/Dockerfile.backend --build-arg BASE_IMAGE=$(BASE_IMAGE) -t nginx-love-backend:$(IMAGE_TAG) .

web frontend:
	docker build -f apps/web/Dockerfile \
		--build-arg VITE_API_URL=/api \
		--build-arg BACKEND_URL=http://backend:3001 \
		-t nginx-love-frontend:$(IMAGE_TAG) .

all: base backend web

up:
	docker compose --env-file .env up -d --build

down:
	docker compose --env-file .env down

logs:
	docker compose --env-file .env logs -f

pull-up:
	docker compose -f docker-compose.yml -f docker-compose.pull.yml --env-file .env up -d

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up --build
