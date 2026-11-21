FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install exactly what package-lock.json says, without dev tools
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY app.js server.js ./

# The node image ships a non-root "node" user
USER node
EXPOSE 8080
CMD ["node", "server.js"]
