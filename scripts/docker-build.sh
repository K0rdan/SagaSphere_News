#!/usr/bin/env bash
echo "Building $1:$npm_package_version ..."
docker build -t "$1:$npm_package_version" .