### 03-14-2024 Dockerfile for containerizing openSphere.
# FROM registry.dso.xc.nga.mil/core/containers/base/node:16.20.2
FROM node:lts-alpine3.19

USER root

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./
#COPY package-lock.json ./
COPY . ./
# RUN npm install
RUN yarn install --ignore-engines
RUN yarn add goog
RUN cd /app/node_modules/select2/ 
# RUN ls
# RUN cp dist/js/select2.js ./ 
# RUN cp dist/css/select2.css ./
# RUN touch test.png
# Install Python if not already installed
RUN if ! command -v python3 &> /dev/null; then \
    apk add --no-cache python3 && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    ln -sf /usr/bin/pip3 /usr/bin/pip && \
    export PYTHONHOME=/usr/local; \
fi
RUN apk update && \
    apk add --no-cache firefox

# RUN yarn run dev

# Default to UTF-8 file.encoding
# ENV LANG C.UTF-8

# add a simple script that can auto-detect the appropriate JAVA_HOME value
# based on whether the JDK or only the JRE is installed

# RUN { \
#         echo '#!/bin/sh'; \
#         echo 'set -e'; \
#         echo; \
#         echo 'dirname "$(dirname "$(readlink -f "$(which javac || which java)")")"'; \
#     } > /usr/local/bin/docker-java-home \
#     && chmod +x /usr/local/bin/docker-java-home

# ENV JAVA_HOME /usr/lib/jvm/java-1.8-openjdk
# ENV PATH $PATH:/usr/lib/jvm/java-1.8-openjdk/jre/bin:/usr/lib/jvm/java-1.8-openjdk/bin

# ENV JAVA_VERSION 8u111
# ENV JAVA_ALPINE_VERSION 8.111.14-r0

# RUN set -x && apk add --no-cache openjdk8 && [ "$JAVA_HOME" = "$(docker-java-home)" ]

# Install npm dependencies including npm-run-all
# RUN yarn add npm-run-all

# RUN yarn add modernizr

# RUN yarn add browserify

# Install npm dependencies including rimraf
# RUN yarn add rimraf -g

# RUN yarn add typeface-open-sans -g

#RUN yarn add closure-util -g

#RUN yarn add resolve -g
#RUN yarn add node-sass -g
# RUN yarn add node-sass
# RUN yarn add opensphere-build-closure-helper --save-dev -g
# RUN yarn add opensphere-build-index --save-dev -g
# RUN yarn add opensphere-build-resolver --save-dev -g
# RUN yarn add opensphere-state-schema --save-dev -g

# RUN yarn cache clean

# RUN rm -rf node_modules

# Install project dependencies
# RUN yarn add --force

# Copy the rest of the working directory's source code
# COPY . .

# Expose the port that your app runs on
# EXPOSE 8282

#RUN npm run start-server
#RUN npm run build
# RUN yarn run dev --force

# CMD yarn run start-server
#CMD npm run stop-server