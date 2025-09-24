# Use Node 20 slim
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all files
COPY . .

# Build front-end (if using React/Vite)
# If your dist already exists, comment this out
# RUN npm run build

# Ensure required folders exist
RUN mkdir -p /app/uploads /data

# Set environment variable for SQLite
ENV DATABASE_PATH=/data/database.sqlite

# Expose port 8080 (matches fly.toml)
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
