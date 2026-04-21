const dbName = process.env.MONGO_DB || 'fruitsdb';
const appDbUsername = process.env.APP_DB_USERNAME || 'fruits_app';
const appDbPassword = process.env.APP_DB_PASSWORD || 'OctopusApp2026!';

db = db.getSiblingDB(dbName);

db.fruits.insertMany([
  { _id: 1, name: 'apples', qty: 5, rating: 3 },
  { _id: 2, name: 'bananas', qty: 7, rating: 1, microsieverts: 0.1 },
  { _id: 3, name: 'oranges', qty: 6, rating: 2 },
  { _id: 4, name: 'avocados', qty: 3, rating: 5 }
]);

db.createUser({
  user: appDbUsername,
  pwd: appDbPassword,
  roles: [{ role: 'readWrite', db: dbName }]
});
