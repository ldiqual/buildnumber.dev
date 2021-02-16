FROM postgres:11.11
COPY create-databases.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/create-databases.sh
