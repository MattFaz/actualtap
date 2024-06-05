# use node alpine image as build image
FROM node:lts-alpine

# Install Yarn
RUN apk add --no-cache yarn

# create work directory in app folder
WORKDIR /app

# copy over files
COPY package.json yarn.lock /app/

# install all dependencies
RUN yarn install --frozen-lockfile

# copy over all files to the work directory
ADD ./src /app

# expose the host and port 3001 to the server
EXPOSE 3001

# start the app
CMD ["node", "server.js"]
