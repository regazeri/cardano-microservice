FROM node:12.13-alpine

ARG env
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN if [ "$env" == "dev" ];then apk add nano; fi && npm install
RUN npm run build
RUN echo "npm run start:${env}" >> ci/docker-entrypoint.sh && mv ci/docker-entrypoint.sh docker-entrypoint.sh && chmod +x docker-entrypoint.sh
EXPOSE 8100

ENTRYPOINT ["./docker-entrypoint.sh"]
