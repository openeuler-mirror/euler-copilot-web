#!/bin/bash

export $(cat .env | xargs)
bash -c "envsubst '\${FRAMEWORK_URL}' < nginx.conf.tmpl > /config/nginx.conf"
nginx -c /config/nginx.conf -g "daemon off;"