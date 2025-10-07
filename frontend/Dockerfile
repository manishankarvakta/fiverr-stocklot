# Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Set npm registry and increase timeout
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-timeout 60000

# Copy package files
COPY package*.json ./

# Clean install with verbose logging
RUN npm ci --legacy-peer-deps --loglevel verbose || \
    npm install --legacy-peer-deps --loglevel verbose

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]