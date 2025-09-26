# Use Node 20 slim
FROM node:20-slim

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy all files
COPY . .

# Build the main app
RUN npm run build

# Build the website
WORKDIR /app/website
COPY website/package*.json ./
RUN npm install
RUN npm run build

# Go back to root
WORKDIR /app

# Remove dev dependencies for smaller image
RUN npm prune --production

# Make sure folders exist
RUN mkdir -p /app/uploads /data

# Set SQLite DB path
ENV DATABASE_PATH=/data/database.sqlite
ENV NODE_ENV=production

# Expose port 8080
EXPOSE 8080

# Start Express server
CMD ["node", "server.js"]
