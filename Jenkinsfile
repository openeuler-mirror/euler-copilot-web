node {
    properties([
        parameters([
            string(name: "REPO", defaultValue: "web-dev", description: "当前项目名"),
            string(name: "REG", defaultValue: "", description: "Docker镜像地址"),
            string(name: "SSH_HOST", defaultValue: "", description: "SSH主机名")
        ])
    ])

    echo "拉取代码仓库"
    checkout scm
    
    def BUILD = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    
    echo "构建当前分支Docker Image镜像"
    docker.withRegistry("https://${params.REG}", "dockerAuth") {
        def image = docker.build("${params.REG}/${params.REPO}:${BUILD}", "-f ./deploy/prod/Dockerfile .")
        image.push()
    }

    def remote = [:]
    remote.name = "machine"
    remote.host = "${params.SSH_HOST}"
    withCredentials([usernamePassword(credentialsId: "ssh", usernameVariable: 'sshUser', passwordVariable: 'sshPass')]) {
        remote.user = sshUser
        remote.password = sshPass
    }
    remote.allowAnyHosts = true
        
    echo "清除构建缓存"
    sshCommand remote: remote, command: "sh -c \"docker rmi ${params.REG}/${params.REPO}:${BUILD} || true\";"
    sshCommand remote: remote, command: "sh -c \"docker image prune -f || true\";";
    sshCommand remote: remote, command: "sh -c \"docker builder prune -f || true\";";
            
    echo "重新部署"
    sshCommand remote: remote, command: "sh -c \"kubectl -n euler-copilot set image deployment/web-deploy web=${params.REG}/${params.REPO}:${BUILD}\";"
}
