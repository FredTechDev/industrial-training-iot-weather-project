FROM node:20-alpine AS frontend-build

ARG VITE_MQTT_BROKER_URL
ARG VITE_MQTT_USERNAME
ARG VITE_MQTT_PASSWORD
ARG VITE_MQTT_CLIENT_PREFIX

ENV VITE_MQTT_BROKER_URL=$VITE_MQTT_BROKER_URL
ENV VITE_MQTT_USERNAME=$VITE_MQTT_USERNAME
ENV VITE_MQTT_PASSWORD=$VITE_MQTT_PASSWORD
ENV VITE_MQTT_CLIENT_PREFIX=$VITE_MQTT_CLIENT_PREFIX

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci --only=production || npm install --only=production
RUN npx prisma generate

COPY backend/ .

COPY --from=frontend-build /frontend/dist /app/frontend/dist

RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "src/app.js"]
