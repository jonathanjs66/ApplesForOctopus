const express = require('express');
const mongoose = require('mongoose');

const app = express();

const PORT = process.env.APP_PORT || 3000;
const MONGO_HOST = process.env.MONGO_HOST || 'mongodb';
const MONGO_PORT = process.env.MONGO_PORT || '27017';
const MONGO_DB = process.env.MONGO_DB || 'fruitsdb';
const MONGO_USERNAME = process.env.MONGO_USERNAME || 'admin';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || 'password';

const MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

const fruitSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  qty: Number,
  rating: Number,
  microsieverts: Number
});

const Fruit = mongoose.model('Fruit', fruitSchema, 'fruits');

app.get('/health', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;

  if (!mongoReady) {
    return res.status(503).json({
      status: 'degraded',
      mongoState: mongoose.connection.readyState
    });
  }

  return res.status(200).json({
    status: 'ok',
    mongoState: mongoose.connection.readyState
  });
});

app.get('/', async (req, res) => {
  try {
    const apples = await Fruit.findOne({ name: 'apples' }).lean();

    if (!apples) {
      return res.status(500).send('Apples record not found in MongoDB.');
    }

    return res.send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Octopus Fruits App</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              background: #fffaf3;
              color: #222;
            }

            .card {
              max-width: 700px;
              padding: 24px;
              border-radius: 16px;
              background: #ffffff;
              border: 1px solid #f1d7b8;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            }

            h1 {
              margin-top: 0;
              color: #c45b12;
            }

            p {
              font-size: 18px;
              line-height: 1.6;
            }

            strong {
              color: #8f3f08;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <p>Hello world, with a little apples :)</p>
            <h1>🍎 Fruit Inventory</h1>
            <p>We have <strong>${apples.qty}</strong> apples in stock.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Failed to load apples data:', error);
    return res.status(500).send('Application could not load data from MongoDB.');
  }
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });

    app.listen(PORT, () => {
      console.log(`App running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

start();
