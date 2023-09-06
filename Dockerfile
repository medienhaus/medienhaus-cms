# Taken from https://dev.to/deepakfilth/how-i-dockerized-my-next-js-website-4f3a

# Creates a layer from node:alpine image.
FROM node:alpine

# Sets an environment variable
ENV PORT 3000

# Sets the working directory for any RUN, CMD, ENTRYPOINT, COPY, and ADD commands
WORKDIR /usr/src/app

# Copy new files or directories into the filesystem of the container
COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app

# Execute commands in a new layer on top of the current image and commit the results
RUN npm install

EXPOSE 3000

ENTRYPOINT ["npm", "run"]

# Use this command as a default (can be overridden via "command" option in docker-compose.yml)
CMD ["start"]
