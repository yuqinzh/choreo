FROM node:lts-alpine3.18

WORKDIR /home/choreouser

COPY files/* /home/choreouser/

EXPOSE 3000

ENV PM2_HOME=/tmp

RUN apk add --no-cache iproute2 vim netcat-openbsd &&\
    APP=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 6) &&\
    rm -f temp.zip &&\
    addgroup --gid 10001 choreo &&\
    adduser --disabled-password  --no-create-home --uid 10001 --ingroup choreo choreouser

ENTRYPOINT [ "node", "server.js" ]

USER 10001
