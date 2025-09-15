#!/bin/bash

export $(cat .env | xargs)
bash -c "envsubst '\${RAG_WEB_URL} \${FRAMEWORK_URL} \${DEEPINSIGHT_WEB_URL}' < nginx.conf.tmpl > /config/nginx.conf"
nginx -c /config/nginx.conf -g "daemon off;"
