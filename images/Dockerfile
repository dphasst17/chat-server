# Dockerfile trong thư mục chat
FROM node:20

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

# Cài đặt NestJS CLI
RUN npm install -g @nestjs/cli
RUN npm install


COPY . .

CMD ["npm", "run", "start:dev"]