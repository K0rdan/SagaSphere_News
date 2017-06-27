FROM node:7-slim

RUN mkdir -p /usr/news
COPY ./ /usr/news
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    cd /usr/news && \
    yarn install --loglevel warn && \
    yarn build

WORKDIR /usr/news