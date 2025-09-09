# backend/Dockerfile
FROM node:20-alpine

# Create app dir
WORKDIR /app

# Copy package manifests first (for Docker layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including dev deps) so we can build TypeScript
RUN npm ci

# Copy the rest of the source
COPY . .

# Build TypeScript to dist/
RUN npm run build

# Optional: remove devDependencies to slim image (npm prune)
RUN npm prune --production

# Expose port (Render will set PORT env)
ENV PORT=4000
EXPOSE 4000

# Use the production start command
CMD ["npm", "run", "start:prod"]
