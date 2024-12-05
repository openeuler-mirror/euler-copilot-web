FROM node:18.18.2-alpine
WORKDIR /opt/eulerCopilot-web

COPY . .
RUN sed -i 's/qa-robot-openeuler/euler-copilot-master/g' .env && \
    npm install pnpm -g --registry=https://registry.npmmirror.com && \
    pnpm install --registry=https://registry.npmmirror.com && \
    pnpm run build


FROM openeuler/openeuler:22.03-lts-sp1

ENV TZ Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

RUN sed -i 's|repo.openeuler.org|mirrors.nju.edu.cn/openeuler|g' /etc/yum.repos.d/openEuler.repo && \
    sed -i '/metalink/d' /etc/yum.repos.d/openEuler.repo && \
    sed -i '/metadata_expire/d' /etc/yum.repos.d/openEuler.repo && \
    yum update -y && \
    yum install -y nginx shadow-utils passwd gettext && \
    yum clean all && \
    groupadd -g 1001 eulercopilot && \
    useradd -m -u 1001 -g eulercopilot -s /sbin/nologin eulercopilot && \
    passwd -l eulercopilot

COPY --from=0 /opt/eulerCopilot-web/dist /usr/share/nginx/html
COPY --from=0 /opt/eulerCopilot-web/public /usr/share/nginx/html
COPY --from=0 /opt/eulerCopilot-web/deploy/prod/nginx.conf.tmpl /home/eulercopilot/nginx.conf.tmpl
COPY --from=0 /opt/eulerCopilot-web/deploy/prod/start.sh /home/eulercopilot/start.sh

RUN sed -i 's/umask 002/umask 027/g' /etc/bashrc && \
    sed -i 's/umask 022/umask 027/g' /etc/bashrc && \
    chown -R eulercopilot:eulercopilot /usr/share/nginx && \
    chown -R eulercopilot:eulercopilot /var/log/nginx && \
    chown -R eulercopilot:eulercopilot /var/lib/nginx && \
    chown -R eulercopilot:eulercopilot /etc/nginx && \
    chmod -R 750 /var/log/nginx && \
    find /var/log/nginx -type f -exec chmod 640 {} + && \
    chmod -R 500 /var/lib/nginx && \
    chmod -R 500 /usr/share/nginx && \
    chmod -R 500 /etc/nginx && \
    find /var/log/nginx -type f -exec chmod 400 {} +

RUN yum remove -y gdb-gdbserver && \
    sh -c "find /usr /etc \( -name *yum* -o -name *dnf* -o -name *vi* -o -name *sqlite* -o -name *python* \) -exec rm -rf {} + || true" && \
    sh -c "find /usr /etc \( -name ps -o -name top \) -exec rm -rf {} + || true"

EXPOSE 8080

USER eulercopilot
WORKDIR /home/eulercopilot

ENTRYPOINT [ "bash", "./start.sh" ]
