# A local Jenkins for trying the Jenkinsfile: Jenkins LTS plus Node, the Docker CLI, kubectl and jq.
FROM jenkins/jenkins:lts-jdk21

USER root

# Node 24 (node, npm and npx), copied from the official image
COPY --from=node:24-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:24-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Docker CLI (talks to the host's Docker through the mounted socket), kubectl and jq
ARG TARGETARCH=amd64
ARG KUBECTL_VERSION=v1.34.0
COPY --from=docker:cli /usr/local/bin/docker /usr/local/bin/docker
RUN apt-get update && apt-get install -y --no-install-recommends jq curl && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${TARGETARCH}/kubectl" -o /usr/local/bin/kubectl \
 && chmod +x /usr/local/bin/kubectl

USER jenkins

# Plugins, and Configuration as Code so Jenkins starts with the pipeline job already set up
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
COPY casc.yaml /var/jenkins_home/casc.yaml
ENV CASC_JENKINS_CONFIG=/var/jenkins_home/casc.yaml \
    JAVA_OPTS=-Djenkins.install.runSetupWizard=false
