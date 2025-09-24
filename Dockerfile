# Build and run Node + Express API with SQLite
FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the code
COPY . .

# Ensure upload and data directories exist
RUN mkdir -p /app/uploads /data

# Use Fly volume for SQLite persistence
ENV DATABASE_PATH=/data/database.sqlite

EXPOSE 8080
CMD ["node", "server.js"]
