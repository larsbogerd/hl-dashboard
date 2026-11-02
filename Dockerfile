FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
LABEL org.opencontainers.image.source=https://github.com/larsbogerd/hl-dashboard
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3030
CMD ["node", "server/index.ts"]
