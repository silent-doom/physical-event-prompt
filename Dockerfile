# ─── EventFlow – Cloud Run Deployment ───────────────────────────────────────
# Static site served by nginx:alpine
# Cloud Run will set PORT env var; nginx listens on it via envsubst

FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/eventflow.conf

# Copy all static files into the nginx html directory
COPY . /usr/share/nginx/html

# Make sure the service worker and manifest are accessible from root
WORKDIR /usr/share/nginx/html

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
