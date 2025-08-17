FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

WORKDIR /usr/src/app/src

# Install dotenv-cli if you need it
RUN npm install -g dotenv-cli

CMD ["sh", "-c", "dotenv -e ../.env -- node index.js"]