# Build stage
FROM docker.io/library/node:18 as build

ENV HUGO_VERSION 0.108.0
ENV GO_VERSION 1.19

# Install dependencies
RUN curl -sLo hugo.tar.gz "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz" && \
  mkdir hugo && \
  tar xzf hugo.tar.gz -C hugo/ && \
  rm -r hugo.tar.gz && \
  mv hugo/hugo /usr/bin/hugo && \
  rm -r hugo/

RUN curl -sLo go.tar.gz "https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz" && \
  mkdir /usr/local/go && \
  tar xzf go.tar.gz -C /usr/local && \
  ln -s /usr/local/go/bin/go /usr/bin/go && \
  rm -r go.tar.gz

# Install dependency configs
COPY config.toml go.mod go.sum package.hugo.json /build/

# Install dependencies
RUN cd /build && hugo mod get && hugo mod npm pack && npm i

# Build site html
ARG BASE_URL=https://realmenweardress.es
COPY . /build
RUN cd /build && \
  hugo --minify --baseURL ${BASE_URL}

# Runtime stage
FROM docker.io/library/nginx:mainline-alpine
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/public/. .
