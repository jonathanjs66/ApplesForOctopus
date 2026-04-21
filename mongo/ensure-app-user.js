const dbName = process.env.MONGO_DB || 'fruitsdb';
const appDbUsername = process.env.APP_DB_USERNAME || 'fruits_app';
const appDbPassword = process.env.APP_DB_PASSWORD;

if (!appDbPassword) {
  throw new Error('APP_DB_PASSWORD is required');
}

db = db.getSiblingDB(dbName);

const roles = [{ role: 'readWrite', db: dbName }];

if (db.getUser(appDbUsername)) {
  db.updateUser(appDbUsername, {
    pwd: appDbPassword,
    roles
  });
  print(`Updated password for ${appDbUsername}`);
} else {
  db.createUser({
    user: appDbUsername,
    pwd: appDbPassword,
    roles
  });
  print(`Created user ${appDbUsername}`);
}
