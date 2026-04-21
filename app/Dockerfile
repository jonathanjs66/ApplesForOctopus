FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache mongodb-tools

COPY package*.json ./

RUN npm install

COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
