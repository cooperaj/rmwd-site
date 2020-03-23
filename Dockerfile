# Build stage
FROM node:8 as build

ENV HUGO_VERSION 0.68.1

# Install dependencies
RUN apt-get update && apt-get install -y \
    nasm && \
  curl -sLo hugo.tar.gz "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz" && \
  mkdir hugo && \
  tar xzf hugo.tar.gz -C hugo/ && \
  rm -r hugo.tar.gz && \
  mv hugo/hugo /usr/bin/hugo && \
  rm -r hugo/

# Install dependency configs
COPY themes/rmwd/package.json themes/rmwd/package-lock.json /build/themes/rmwd/

# Create .npmrc config file
ARG FONT_AWESOME_KEY=none
RUN echo '@fortawesome:registry=https://npm.fontawesome.com/\n\
//npm.fontawesome.com/:_authToken='${FONT_AWESOME_KEY} \
>> /build/themes/rmwd/.npmrc

# Install dependencies
RUN cd /build/themes/rmwd && npm i

# Build assets
COPY ./themes/rmwd /build/themes/rmwd
RUN cd /build/themes/rmwd && \
  npm run production

# Build site html
ARG BASE_URL=https://realmenweardress.es
COPY . /build
RUN cd /build && \
  hugo --minify --baseURL ${BASE_URL}

# Runtime stage
FROM nginx:mainline-alpine
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/public/. .
