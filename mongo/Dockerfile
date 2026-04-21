FROM mongo:6

COPY init.js /docker-entrypoint-initdb.d/init.js
COPY ensure-app-user.js /opt/mongo/ensure-app-user.js
