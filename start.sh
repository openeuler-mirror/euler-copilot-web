#! /bin/sh
cp ~/config/euler-copilot-web/*.key ~/config/euler-copilot-web/*.crt ~/config/euler-copilot-web/.env .

if [ -f "$HOME/config/euler-copilot-web/nginx.conf" ]; then
    cp "$HOME/config/euler-copilot-web/nginx.conf" "$(dirname "$0")/deploy/build/"
else 
    echo "nginx.conf file not found in config directory"
fi

if [ -f "$HOME/config/euler-copilot-web/dhparam.pem" ]; then
  cp "$HOME/config/euler-copilot-web/dhparam.pem" "$(dirname "$0")/deploy/nginx/"
else 
  echo "dhparam.pem file not found in config directory"
fi

sudo docker stop euler-copilot-web
sudo docker rm euler-copilot-web
sudo docker rmi euler-copilot-web

sudo docker build -t euler-copilot-web -f ./deploy/build/Dockerfile .

cmd=(
  sudo docker run 
  -d
  --restart=always
  --name euler-copilot-web
  --network eulercopilot-network
  --ip 172.168.0.3
  -p 8080:8080
  -e TZ=Asia/Shanghai
  euler-copilot-web
)

"${cmd[@]}"