FROM node:23

WORKDIR /app

COPY ui ./ui

WORKDIR /app/ui

RUN npm install

CMD ["npm", "run", "dev"]

