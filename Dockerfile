FROM node:10-alpine

WORKDIR /app


# the app
COPY build build
COPY server server
COPY package.json .
COPY npm-shrinkwrap.json .


# some docs
COPY CODE_OF_CONDUCT.md .
COPY LICENSE .
COPY README.md .


# the deps
RUN npm ci --production && npm ls


EXPOSE 3001


CMD ["npm", "start"]
