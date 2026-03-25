pipeline {
  agent any

  options {
    timestamps()
  }

  environment {
    BACKEND_IMAGE_NAME = "${env.BACKEND_IMAGE_NAME ?: 'smartspend-backend'}"
    FRONTEND_IMAGE_NAME = "${env.FRONTEND_IMAGE_NAME ?: 'smartspend-frontend'}"
    IMAGE_TAG = "${env.IMAGE_TAG ?: env.BUILD_NUMBER}"
    DOCKER_REGISTRY = "${env.DOCKER_REGISTRY ?: ''}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build and Verify') {
      parallel {
        stage('Backend') {
          steps {
            script {
              def backendImage = env.DOCKER_REGISTRY?.trim()
                ? "${env.DOCKER_REGISTRY}/${env.BACKEND_IMAGE_NAME}:${env.IMAGE_TAG}"
                : "${env.BACKEND_IMAGE_NAME}:${env.IMAGE_TAG}"
              
              sh "docker build -t ${backendImage} -f backend/Dockerfile backend"
              sh "docker run --rm ${backendImage} node --check server.js"
              
              env.BACKEND_IMAGE = backendImage
            }
          }
        }

        stage('Frontend') {
          steps {
            script {
              def frontendImage = env.DOCKER_REGISTRY?.trim()
                ? "${env.DOCKER_REGISTRY}/${env.FRONTEND_IMAGE_NAME}:${env.IMAGE_TAG}"
                : "${env.FRONTEND_IMAGE_NAME}:${env.IMAGE_TAG}"

              sh """
                docker build \
                  --build-arg VITE_API_BASE_URL='${env.VITE_API_BASE_URL ?: "http://localhost:8000"}' \
                  --build-arg VITE_GOOGLE_CLIENT_ID='${env.VITE_GOOGLE_CLIENT_ID ?: ""}' \
                  --build-arg VITE_GITHUB_CLIENT_ID='${env.VITE_GITHUB_CLIENT_ID ?: ""}' \
                  -t ${frontendImage} \
                  -f frontend/Dockerfile frontend
              """
              
              env.FRONTEND_IMAGE = frontendImage
            }
          }
        }
      }
    }

    stage('Push Docker Images') {
      when {
        expression { return env.DOCKER_REGISTRY?.trim() && env.DOCKER_CREDENTIALS_ID?.trim() }
      }
      steps {
        script {
          docker.withRegistry("https://${env.DOCKER_REGISTRY}", env.DOCKER_CREDENTIALS_ID) {
            sh "docker push ${env.BACKEND_IMAGE}"
            sh "docker push ${env.FRONTEND_IMAGE}"
          }
        }
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}
