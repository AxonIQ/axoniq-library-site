#!/bin/bash

cloneOrPullMaster () {
  if [ -d "$1" ]; then
    echo "$1 does exist - pulling"
      cd $1
      git pull origin $3
      git checkout $3
      cd ..
    else
    echo "$1 does not exist - Setting up"
      git clone --depth 30 --single-branch --branch $3 $2 $1
  fi
}

# Axon Framework has two branches: master and 4.10.x
cloneOrPullMaster "AxonFramework-main" "https://github.com/AxonFramework/AxonFramework.git" "master"
cloneOrPullMaster "AxonFramework-latest" "https://github.com/AxonFramework/AxonFramework.git" "axon-4.10.x"
cloneOrPullMaster "extension-amqp" "https://github.com/AxonFramework/extension-amqp.git" "master"
cloneOrPullMaster "extension-jgroups" "https://github.com/AxonFramework/extension-jgroups.git" "master"
cloneOrPullMaster "extension-jobrunrpro" "https://github.com/AxonFramework/extension-jobrunrpro.git" "main"
cloneOrPullMaster "extension-kafka" "https://github.com/AxonFramework/extension-kafka.git" "master"
cloneOrPullMaster "extension-kotlin" "https://github.com/AxonFramework/extension-kotlin.git" "master"
cloneOrPullMaster "extension-mongo" "https://github.com/AxonFramework/extension-mongo.git" "master"
cloneOrPullMaster "extension-multitenancy" "https://github.com/AxonFramework/extension-multitenancy.git" "main"
cloneOrPullMaster "extension-reactor" "https://github.com/AxonFramework/extension-reactor.git" "master"
cloneOrPullMaster "extension-spring-aot" "https://github.com/AxonFramework/extension-spring-aot.git" "main"
cloneOrPullMaster "extension-springcloud" "https://github.com/AxonFramework/extension-springcloud.git" "master"
cloneOrPullMaster "extension-tracing" "https://github.com/AxonFramework/extension-tracing.git" "master"
cloneOrPullMaster "axon-server" "https://github.com/AxonIQ/axon-server.git" "master"
cloneOrPullMaster "axon-server-image-build" "https://github.com/AxonIQ/axon-server-image-build.git" "main"
cloneOrPullMaster "axon-synapse" "https://github.com/AxonIQ/axon-synapse.git" "synapse-0.11"
cloneOrPullMaster "console-web" "https://github.com/AxonIQ/console-web.git" "main"
cloneOrPullMaster "giftcard-demo" "https://github.com/AxonIQ/giftcard-demo.git" "master"
cloneOrPullMaster "bike-rental-quick-start" "https://github.com/AxonIQ/bike-rental-quick-start.git" "main"

echo "You should be up-to-date now!"