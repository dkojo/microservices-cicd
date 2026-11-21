#!/usr/bin/env bash
# Deploys both services to the current kubectl context with the given image tag, then waits until they are ready.
# Usage: scripts/deploy.sh <image-tag>
set -euo pipefail
TAG="${1:?usage: deploy.sh <image-tag>}"

for svc in users orders; do
  sed "s/IMAGE_TAG/${TAG}/" "k8s/${svc}.yaml" | kubectl apply -f -
done

for svc in users orders; do
  kubectl rollout status "deployment/${svc}" --timeout=120s
done
kubectl get pods -o wide
