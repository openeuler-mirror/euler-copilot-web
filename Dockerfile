# 第一阶段：构建前端项目
FROM node:22.14.0-alpine
WORKDIR /opt

# 更换Alpine为国内镜像源（解决apk安装失败问题）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

COPY . .
# 配置国内镜像，加速Electron及依赖下载
ENV ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" \
    ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

# 安装必要工具（git+ssh客户端+CA证书），并配置Git协议转换
RUN apk add --no-cache git openssh-client ca-certificates \
    && git config --global url."https://github.com/".insteadOf git@github.com: \
    && git config --global url."https://".insteadOf git:// \
    && npm install pnpm -g --registry=https://registry.npmmirror.com \
    && pnpm config set registry https://registry.npmmirror.com \
    && pnpm config set network-timeout 600000 \
    && pnpm install \
    && pnpm run build

# 第二阶段：部署到nginx
FROM hub.oepkgs.net/openeuler/openeuler:24.03-lts-sp2

ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# 替换OpenEuler镜像源为华为云，加速依赖安装
RUN sed -i 's|repo.openeuler.org|repo.huaweicloud.com/openeuler|g' /etc/yum.repos.d/openEuler.repo && \
    sed -i '/metalink/d' /etc/yum.repos.d/openEuler.repo && \
    sed -i '/metadata_expire/d' /etc/yum.repos.d/openEuler.repo && \
    yum update -y && \
    yum install -y nginx shadow-utils passwd gettext && \
    yum clean all

# 从构建阶段复制产物到nginx
COPY --from=0 /opt/dist /usr/share/nginx/html
COPY --from=0 /opt/public /usr/share/nginx/html
COPY --from=0 /opt/deploy/nginx.conf.tmpl /opt/nginx.conf.tmpl
COPY --from=0 /opt/deploy/start.sh /opt/start.sh

EXPOSE 8080
WORKDIR /opt
ENTRYPOINT [ "bash", "./start.sh" ]

