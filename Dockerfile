# syntax=docker/dockerfile:1
#
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=lts

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
#ENV NODE_ENV=production
ENV NODE_ENV=development

# Define working directory for the application.
WORKDIR /usr/src/app

# Download dependencies and make use of caching.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm clean-install

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD npm start
