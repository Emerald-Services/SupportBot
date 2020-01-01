FROM node:alpine

MAINTAINER: Thien Tran, <contact@thientran.io>

RUN apk update \
    && apk upgrade
    
RUN adduser -D -h /home/container container

RUN npm install
    
    # Ensure UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8
    
WORKDIR /home/container
    
COPY ./entrypoint.sh /entrypoint.sh
CMD ["/bin/ash", "/entrypoint.sh"]
