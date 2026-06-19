#!/usr/bin/env bash
# Full Cloudflare CI pipeline: build once, deploy with secret upload.
# Use as the Workers Builds "Build command" with deploy command: echo "done"
set -euo pipefail

npm run build
bash scripts/cloudflare-deploy.sh
