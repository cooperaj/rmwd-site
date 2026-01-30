# Build stage
FROM docker.io/library/node:25 AS build

ARG TARGETARCH

ENV HUGO_VERSION=0.155.1
ENV GO_VERSION=1.25.5
ENV DART_SASS_VERSION=1.97.3

# Install dependencies
RUN curl -sLo hugo.tar.gz "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-${TARGETARCH}.tar.gz" && \
  mkdir hugo && \
  tar xzf hugo.tar.gz -C hugo/ && \
  rm -r hugo.tar.gz && \
  mv hugo/hugo /usr/bin/hugo && \
  rm -r hugo/

RUN curl -sLo go.tar.gz "https://dl.google.com/go/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz" && \
  mkdir /usr/local/go && \
  tar xzf go.tar.gz -C /usr/local && \
  ln -s /usr/local/go/bin/go /usr/bin/go && \
  rm -r go.tar.gz

RUN set -eux; \
  if [ "${TARGETARCH}" = "amd64" ]; then arch="x64"; else arch=${TARGETARCH}; fi; \
  curl -sLo dart-sass.tar.gz "https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/dart-sass-${DART_SASS_VERSION}-linux-$arch.tar.gz" && \
  mkdir /usr/local/dart-sass && \
  tar xzf dart-sass.tar.gz -C /usr/local && \
  ln -s /usr/local/dart-sass/sass /usr/bin/sass && \
  rm -r dart-sass.tar.gz

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
