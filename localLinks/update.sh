#!/bin/bash

cloneOrPullMaster () {
  if [ -d "$1" ]; then
    echo "$1 does exist - pulling"
      cd $1
      git pull origin $3
      git checkout -b $3
      cd ..
    else
    echo "$1 does not exist - Setting up"
      git clone --depth 30 --single-branch --branch $3 $2 $1
  fi
}

# Axon Framework has two branches: master and 4.10.x
cloneOrPullMaster "AxonFramework" "https://github.com/AxonFramework/AxonFramework.git" "axon-4.11.x"
cloneOrPullMaster "extension-amqp" "https://github.com/AxonFramework/extension-amqp.git" "axon-amqp-4.11.x"
cloneOrPullMaster "extension-jgroups" "https://github.com/AxonFramework/extension-jgroups.git" "axon-jgroups-4.11.x"
cloneOrPullMaster "extension-jobrunrpro" "https://github.com/AxonFramework/extension-jobrunrpro.git" "axon-jobrunrpro-4.11.x"
cloneOrPullMaster "extension-kafka" "https://github.com/AxonFramework/extension-kafka.git" "axon-kafka-4.11.x"
cloneOrPullMaster "extension-kotlin" "https://github.com/AxonFramework/extension-kotlin.git" "axon-kotlin-4.11.x"
cloneOrPullMaster "extension-mongo" "https://github.com/AxonFramework/extension-mongo.git" "axon-mongo-4.11.x"
cloneOrPullMaster "extension-multitenancy" "https://github.com/AxonFramework/extension-multitenancy.git" "axon-multitenancy-4.11.x"
cloneOrPullMaster "extension-reactor" "https://github.com/AxonFramework/extension-reactor.git" "axon-reactor-4.11.x"
cloneOrPullMaster "extension-spring-aot" "https://github.com/AxonFramework/extension-spring-aot.git" "axon-spring-aot-4.11.x"
cloneOrPullMaster "extension-springcloud" "https://github.com/AxonFramework/extension-springcloud.git" "axon-springcloud-4.11.x"
cloneOrPullMaster "extension-tracing" "https://github.com/AxonFramework/extension-tracing.git" "axon-tracing-4.11.x"
cloneOrPullMaster "axon-server" "https://github.com/AxonIQ/axon-server.git" "axonserver-ee-2024.1.x"
cloneOrPullMaster "axon-server-image-build" "https://github.com/AxonIQ/axon-server-image-build.git" "main"
cloneOrPullMaster "axon-synapse" "https://github.com/AxonIQ/axon-synapse.git" "synapse-0.11"
cloneOrPullMaster "console-web" "https://github.com/AxonIQ/console-web.git" "main"
cloneOrPullMaster "bike-rental-quick-start" "https://github.com/AxonIQ/bike-rental-quick-start.git" "main"

echo "You should be up-to-date now!"