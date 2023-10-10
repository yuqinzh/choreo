FROM node:latest

WORKDIR /home/choreouser

COPY files/* /home/choreouser/

EXPOSE 3000

ENV PM2_HOME=/tmp

RUN apt-get update &&\
    apt-get install -y iproute2 vim netcat-openbsd &&\
    npm install -r package.json &&\
    npm install -g pm2 &&\
    addgroup --gid 10001 choreo &&\
    adduser --disabled-password  --no-create-home --uid 10001 --ingroup choreo choreouser &&\
    usermod -aG sudo choreouser &&\
    chmod +x nezha-agent &&\
    npm install -r package.json

ENTRYPOINT [ "node", "server.js" ]

USER 10001
