# Build stage
FROM node:8 as build

ENV HUGO_VERSION 0.45

# Install dependencies
RUN apt-get update && apt-get install -y \
    nasm && \
  curl -sLo hugo.tar.gz "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz" && \
  mkdir hugo && \
  tar xzf hugo.tar.gz -C hugo/ && \
  rm -r hugo.tar.gz && \
  mv hugo/hugo /usr/bin/hugo && \
  rm -r hugo/

# Install asset building dependencies
COPY .npmrc themes/rmwd/package.json themes/rmwd/package-lock.json /build/themes/rmwd/
RUN cd /build/themes/rmwd && npm i

# Build site
COPY . /build
RUN cd /build/themes/rmwd && \
  npm run production && \
  cd /build && \
  hugo

# Runtime stage
FROM nginx:mainline-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /build/public/. .