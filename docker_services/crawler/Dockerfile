# ref (https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker)

FROM node:16-alpine

WORKDIR /app

# Installs latest Chromium (92) package.
RUN apk add --no-cache chromium
# seperate because font use edge/testing package
RUN apk add wqy-zenhei --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# ENV CHROMIUM_REVISION=961656

COPY package*.json ./
COPY migrations migrations
COPY cookiesTemplate.json cookies.json

RUN npm ci

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser ./node_modules \
    && chown -R pptruser:pptruser ./package.json \
    && chown -R pptruser:pptruser ./package-lock.json \
    && chown -R pptruser:pptruser ./migrations \
    && chown -R pptruser:pptruser ./cookies.json \
    && mkdir -p ./downloads && chown -R pptruser:pptruser ./downloads

# Run everything after as non-privileged user.
USER pptruser
