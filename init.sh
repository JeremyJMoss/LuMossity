#!/bin/bash

# Create user based on env file to connect to
echo "Creating MySQL user: $CMS_DB_USER"

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    CREATE USER IF NOT EXISTS '${CMS_DB_USER}'@'%' IDENTIFIED BY '${CMS_DB_PASSWORD}';
    GRANT ALL PRIVILEGES ON *.* TO '${CMS_DB_USER}'@'%' WITH GRANT OPTION;
    FLUSH PRIVILEGES;
EOSQL
