pipeline {
    agent any

    // Tự kiểm tra GitHub mỗi 2 phút, có commit mới thì chạy (không cần webhook/public IP)
    triggers {
        pollSCM('H/2 * * * *')
    }

    options {
        timestamps()
        timeout(time: 10, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Môi trường') {
            steps {
                sh 'node --version && npm --version'
            }
        }

        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test:ci'
            }
        }

        stage('Smoke test') {
            steps {
                sh '''
                    PORT=3100 node src/server.js > server.log 2>&1 &
                    PID=$!
                    sleep 2
                    curl -fsS http://localhost:3100/api/health
                    kill $PID
                '''
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results.xml'
            archiveArtifacts artifacts: 'test-results.xml, server.log', allowEmptyArchive: true
        }
        success {
            echo 'Build và Test thành công'
        }
        failure {
            echo 'Pipeline lỗi - xem Console Output và tab Test Result'
        }
    }
}
