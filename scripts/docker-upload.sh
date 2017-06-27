#!/usr/bin/env bash
echo "Uploading $1:$npm_package_version ..."
docker tag "$1:$npm_package_version" "$1:latest"
docker push "$1:$npm_package_version"
docker push "$1:latest"
git tag "$1/$npm_package_version"