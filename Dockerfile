# Use lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Install tzdata for GMT+7 (Asia/Bangkok) timezone support
RUN apk add --no-cache tzdata
ENV TZ=Asia/Bangkok

# Set working directory inside container
WORKDIR /app

# Copy dependency package manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source files
COPY . .

# Expose HTTP health-check port
EXPOSE 3000

# Start the Discord bot
CMD ["node", "src/index.js"]
