FROM node:21.6.1

WORKDIR /home/node/app

COPY package*.json ./
RUN npm ci
COPY --chown=node:node . .

RUN npm run build

USER node