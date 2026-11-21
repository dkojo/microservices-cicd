#!/usr/bin/env bash
# Calls the orders service inside the cluster and checks that each order carries a customer name.
# The names live only in the users service, so a pass proves orders reached users over Kubernetes DNS.
set -euo pipefail

kubectl port-forward service/orders 18080:8080 >/dev/null 2>&1 &
PF=$!
trap 'kill $PF 2>/dev/null || true' EXIT

for _ in $(seq 1 20); do
  curl -sf http://127.0.0.1:18080/health >/dev/null && break
  sleep 1
done

body=$(curl -sf http://127.0.0.1:18080/orders)
echo "$body"

count=$(echo "$body" | jq 'length')
named=$(echo "$body" | jq '[.[] | select(.customer != null and .customer != "")] | length')
first=$(echo "$body" | jq -r '.[0].customer')

if [ "$count" -gt 0 ] && [ "$named" -eq "$count" ] && [ "$first" = "Ama Mensah" ]; then
  echo "Smoke test passed: $count orders, every one with a customer name from the users service"
else
  echo "Smoke test FAILED: $named of $count orders have a customer name (first: $first)"
  exit 1
fi
