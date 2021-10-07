# Front-end build
FROM node:14-alpine as build-stage

WORKDIR /build-app
COPY ./ /build-app/
RUN npm install

ENV NODE_ENV production
RUN npm run build

# Application
FROM node:14-alpine
WORKDIR /usr/src/app
COPY --chown=node:node . /usr/src/app
RUN npm ci --production

COPY --from=build-stage /build-app/build/ /usr/src/app/build/

USER node
ENV NODE_ENV production
ENV PORT 3001
EXPOSE 3001
CMD "npm" "start"
