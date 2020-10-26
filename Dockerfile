FROM node:10.14.2
RUN npm install pm2 -g

WORKDIR /app/bin
COPY package*.json ./
RUN npm install

COPY ./src ./

EXPOSE 3000
#CMD [ "pm2-runtime", "app.js", "--output", "/app/logs/pm2out.log", "--error", "/app/logs/pm2err.log" ]
CMD [ "pm2-runtime", "app.js" ]