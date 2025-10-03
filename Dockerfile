FROM nginx:alpine

# Copy custom nginx config
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8088
EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8088/ || exit 1

CMD ["nginx", "-g", "daemon off;"]