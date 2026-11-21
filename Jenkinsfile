// The same pipeline as .github/workflows/ci-cd.yml, for teams that run Jenkins.
// Build, test and the Docker images always run. Push and deploy run only when PUSH_AND_DEPLOY is ticked,
// and need two Jenkins credentials: "ghcr" (username + token with write:packages) and "kubeconfig" (secret file).
pipeline {
  agent any

  parameters {
    booleanParam(name: 'PUSH_AND_DEPLOY', defaultValue: false, description: 'Push images to GHCR and deploy to the cluster in the kubeconfig credential')
  }

  environment {
    REGISTRY = 'ghcr.io/dkojo/microservices-cicd'
  }

  options {
    timeout(time: 20, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  stages {
    stage('Build services') {
      steps {
        script { env.TAG = sh(script: 'git rev-parse --short=7 HEAD', returnStdout: true).trim() }
        sh 'for svc in users orders; do npm ci --prefix "services/$svc"; done'
      }
    }

    stage('Unit tests') {
      steps {
        sh 'for svc in users orders; do npm test --prefix "services/$svc"; done'
      }
    }

    stage('Build Docker images') {
      steps {
        sh 'for svc in users orders; do docker build -t "$REGISTRY/$svc:$TAG" "services/$svc"; done'
      }
    }

    stage('Push images to artifact store') {
      when { expression { params.PUSH_AND_DEPLOY } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'ghcr', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
          sh '''
            echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
            for svc in users orders; do docker push "$REGISTRY/$svc:$TAG"; done
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      when { expression { params.PUSH_AND_DEPLOY } }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'bash scripts/deploy.sh "$TAG"'
        }
      }
    }

    stage('Smoke test') {
      when { expression { params.PUSH_AND_DEPLOY } }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'bash scripts/smoke-test.sh'
        }
      }
    }
  }

  post {
    always {
      sh 'docker logout ghcr.io || true'
    }
  }
}
