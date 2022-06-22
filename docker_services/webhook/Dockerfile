FROM node:16-alpine

WORKDIR /app

# Use monorepo later for not sharing same package.json
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true 

COPY package*.json ./
# need to change, do not copy puppeteer as well
COPY src src
COPY migrations migrations

RUN npm ci

EXPOSE 3000