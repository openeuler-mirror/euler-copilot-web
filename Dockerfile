FROM node:18.18.2-alpine as Builder

RUN mkdir -p /opt/eulerCopilot-web
WORKDIR /opt/eulerCopilot-web
COPY . .

RUN npm install pnpm -g --registry=https://registry.npmmirror.com && \
  pnpm install --registry=https://registry.npmmirror.com && \
  pnpm run build

FROM nginx:1.21.5

COPY --from=Builder /opt/eulerCopilot-web/dist /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
COPY --from=Builder /opt/eulerCopilot-web/deploy/dev/euler_copilot.conf /etc/nginx/conf.d/

ENV RUN_USER nginx
ENV RUN_GROUP nginx

EXPOSE 8080

ENTRYPOINT [ "nginx", "-g", "daemon off;" ]