#!/bin/bash

# This script deploys the application to the remote server using rsync.
# It excludes data files, PDFs, local directories, and temporary artifacts.

set -e

DEST_USER="azureuser"
DEST_HOST="52.237.81.175"
projname=`basename $PWD`

DEST_PATH="/data/${projname}"

# Destination server and path
if [ "$1" == "office" ]; then
    DEST_USER="owenlee"
    DEST_HOST="office.ecomregistry.com"
    DEST_PATH="/Users/owenlee/chatbot_gateway/${projname}"
fi 



DESTINATION="${DEST_USER}@${DEST_HOST}:${DEST_PATH}"

# Source directory (the directory where this script is located)
SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# rsync options
# -a: archive mode (preserves permissions, ownership, times, etc.)
# -v: verbose
# -z: compress data during transfer
# --delete: delete extraneous files from the destination
#
# To test the script without making any changes, uncomment the --dry-run line.
# DRY_RUN_OPT="--dry-run"

echo "Deploying from ${SOURCE_DIR}/ to ${DESTINATION}/"
echo "---"

rsync -avz --delete ${DRY_RUN_OPT} \
  --exclude='__pycache__/' \
  --exclude='*.pyc' \
  --exclude='.git/' \
  --exclude='.gsd/' \
  --exclude='.idea/' \
  --exclude='.vscode/' \
  --exclude='.DS_Store' \
  --exclude='.wwebjs_cache' \
  --exclude='.wwebjs_auth' \
  "${SOURCE_DIR}/" "${DESTINATION}/"

echo "---"
echo "Deployment complete."

