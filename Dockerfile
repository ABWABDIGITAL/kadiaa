FROM node:18-alpine as base

WORKDIR /

COPY package.json package-lock.json ./
RUN npm install && npm cache clean --force

COPY . .
# Set environment variables
ENV PORT=5000

# Expose the port the app runs on
EXPOSE 5000
CMD ["node", "server.js"]


