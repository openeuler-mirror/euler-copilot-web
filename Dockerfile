FROM node:22.14.0-alpine
WORKDIR /opt

COPY . .
# ENV HTTPS_PROXY=
ENV ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
RUN npm install pnpm -g --registry=https://registry.npmmirror.com && \
    pnpm install --registry=https://registry.npmmirror.com && \
    pnpm run build


FROM hub.oepkgs.net/openeuler/openeuler:24.03-lts-sp2

ENV TZ Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

RUN sed -i 's|repo.openeuler.org|mirrors.nju.edu.cn/openeuler|g' /etc/yum.repos.d/openEuler.repo && \
    sed -i '/metalink/d' /etc/yum.repos.d/openEuler.repo && \
    sed -i '/metadata_expire/d' /etc/yum.repos.d/openEuler.repo && \
    yum update -y && \
    yum install -y nginx shadow-utils passwd gettext && \
    yum clean all

COPY --from=0 /opt/dist /usr/share/nginx/html
COPY --from=0 /opt/public /usr/share/nginx/html
COPY --from=0 /opt/nginx.conf.tmpl /opt/nginx.conf.tmpl
COPY --from=0 /opt/start.sh /opt/start.sh

EXPOSE 8080
WORKDIR /opt

ENTRYPOINT [ "bash", "./start.sh" ]
