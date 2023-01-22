FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

EXPOSE 8080

CMD ["yarn", "start"]