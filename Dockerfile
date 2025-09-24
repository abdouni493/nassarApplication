# Use Node 20 slim
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (dev + prod)
RUN npm install

# Copy all files
COPY . .

# Build Vite frontend
RUN npm run build

# Remove dev dependencies for smaller image
RUN npm prune --production

# Make sure folders exist
RUN mkdir -p /app/uploads /data

# Set SQLite DB path
ENV DATABASE_PATH=/data/database.sqlite

# Expose port 8080
EXPOSE 8080

# Start Express server
CMD ["node", "server.js"]
