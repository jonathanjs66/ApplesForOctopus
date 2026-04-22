FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache mongodb-tools

COPY package*.json ./
RUN npm ci

COPY server.js ./

RUN adduser -D appuser && chown -R appuser /app
USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
