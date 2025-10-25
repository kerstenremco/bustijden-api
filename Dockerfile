FROM node:23-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]