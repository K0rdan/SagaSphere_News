#!/usr/bin/env bash
echo "Deleting container 'SagaSphere_News' ..."
docker rm -f SagaSphere_News
echo "Running $1:$npm_package_version ..."
docker run -d --name="SagaSphere_News" --network="sagaspherebackend_default" --link="sagasphere_mysql" -e "SAGASPHERE_MYSQL_HOST=sagasphere_mysql" -e "SAGASPHERE_MYSQL_PORT=3306" -e "SAGASPHERE_MYSQL_LOCALADDRESS=sagasphere_mysql" -e "SAGASPHERE_MYSQL_USER=root" -e "SAGASPHERE_MYSQL_PASSWORD=cky_w+IQ@l" -e "SAGASPHERE_MYSQL_DATABASE=sagasphere" $1:$npm_package_version yarn start