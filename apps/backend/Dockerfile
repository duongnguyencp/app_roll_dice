FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

EXPOSE 3000

CMD ["node_modules/.bin/tsx", "src/index.ts"]
