pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                deleteDir()
                checkout scm
            }
        }

        //Run tests and build using Node inside Docker.
        stage('Test and Build Frontend') {
            steps {
                sh '''#!/bin/bash
set -euo pipefail

docker run --rm \
    --volumes-from jenkins \
    --user "$(id -u):$(id -g)" \
    -e HOME=/tmp \
    -e VITE_AUTH_API_BASE_URL=/auth \
    -e VITE_BOOKING_API_BASE_URL=/booking \
    -e VITE_NOTIFICATION_API_BASE_URL=/notifications \
    -w "$WORKSPACE" \
    node:22-bookworm \
    sh -ec 'npm ci && npm test && npm run build'

test -s dist/index.html
test -d dist/assets
tar -czf frontend.tar.gz -C dist .
'''
            }
        }

        //Deploy the frontend without restarting backend containers.
        stage('Deploy Frontend to EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'homehub-ec2-ssh',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'EC2_USER'
                    )
                ]) {
                    sh '''#!/bin/bash
set -euo pipefail
set +x

REMOTE_HOST="$EC2_USER@ec2-51-21-195-121.eu-north-1.compute.amazonaws.com"

SSH_OPTIONS=(
    -i "$EC2_KEY"
    -o BatchMode=yes
    -o IdentitiesOnly=yes
    -o StrictHostKeyChecking=yes
    -o UserKnownHostsFile="$HOME/.ssh/homehub_known_hosts"
    -o ConnectTimeout=15
    -o ServerAliveInterval=30
    -o ServerAliveCountMax=3
)

scp "${SSH_OPTIONS[@]}" frontend.tar.gz \
    "$REMOTE_HOST:homehub/frontend-build-${BUILD_NUMBER}.tar.gz"

ssh "${SSH_OPTIONS[@]}" "$REMOTE_HOST" \
    bash -s -- "$BUILD_NUMBER" <<'REMOTE'
set -euo pipefail

RELEASE="$HOME/homehub/frontend-releases/build-$1"
ARCHIVE="$HOME/homehub/frontend-build-$1.tar.gz"
WEB_ROOT="/var/www/homehub"

mkdir -p "$RELEASE"
tar -xzf "$ARCHIVE" -C "$RELEASE"

test -s "$RELEASE/index.html"
test -d "$RELEASE/assets"

sudo -n nginx -t
sudo -n mkdir -p "$WEB_ROOT"

#Keep the previous entry point for rollback.
HAD_INDEX=false
if sudo -n test -f "$WEB_ROOT/index.html"; then
    sudo -n cp "$WEB_ROOT/index.html" "$RELEASE/previous-index.html"
    HAD_INDEX=true
fi

#Copy assets and public files before replacing the HTML entry point.
#Retain older assets for browser tabs using the previous release.
while IFS= read -r -d '' ENTRY; do
    NAME=$(basename "$ENTRY")
    if [ "$NAME" != "index.html" ] && [ "$NAME" != "previous-index.html" ]; then
        sudo -n cp -a "$ENTRY" "$WEB_ROOT/"
    fi
done < <(find "$RELEASE" -mindepth 1 -maxdepth 1 -print0)

sudo -n find "$WEB_ROOT" -type d -exec chmod 755 {} +
sudo -n find "$WEB_ROOT" -type f -exec chmod 644 {} +

#Switch the entry point atomically after all assets are available.
sudo -n install -m 644 "$RELEASE/index.html" "$WEB_ROOT/index.html.next"
sudo -n mv "$WEB_ROOT/index.html.next" "$WEB_ROOT/index.html"

#Check that Nginx serves the exact entry point from this build.
if curl --fail --silent --show-error \
    --retry 3 --retry-delay 2 \
    --connect-timeout 5 --max-time 15 \
    -H 'Host: 51.21.195.121' \
    http://127.0.0.1/ -o "$RELEASE/served-index.html" \
    && cmp -s "$RELEASE/index.html" "$RELEASE/served-index.html"; then
    rm -f "$ARCHIVE"
    echo "Frontend deployed successfully: build-$1"
else
    echo "Frontend verification failed."

    if [ "$HAD_INDEX" = true ]; then
        sudo -n install -m 644 \
            "$RELEASE/previous-index.html" "$WEB_ROOT/index.html.next"
        sudo -n mv "$WEB_ROOT/index.html.next" "$WEB_ROOT/index.html"
        echo "Previous frontend entry point restored."
    else
        sudo -n rm -f "$WEB_ROOT/index.html"
    fi

    exit 1
fi
REMOTE
'''
                }
            }
        }
    }

    post {
        success {
            archiveArtifacts(
                artifacts: 'frontend.tar.gz',
                fingerprint: true
            )
        }
    }
}