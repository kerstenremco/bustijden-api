FROM node:22-bookworm AS bustijdenapi-build

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm install
RUN npx prisma generate
RUN npm run build
# @prisma, .prisma

FROM node:22-bookworm

WORKDIR /app
COPY --from=bustijdenapi-build /app/package*.json ./
RUN npm install --omit=dev
COPY --from=bustijdenapi-build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=bustijdenapi-build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=bustijdenapi-build /app/dist ./dist
COPY prisma ./prisma
COPY entrypoint.sh ./
EXPOSE 3000
CMD [ "bash", "entrypoint.sh" ]