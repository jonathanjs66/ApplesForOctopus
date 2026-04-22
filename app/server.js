const express = require('express');
const mongoose = require('mongoose');
const { mkdir, readdir } = require('fs/promises');
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.APP_PORT || 3000;
const MONGO_HOST = process.env.MONGO_HOST || 'mongodb';
const MONGO_PORT = process.env.MONGO_PORT || '27017';
const MONGO_DB = process.env.MONGO_DB || 'fruitsdb';
const APP_DB_USERNAME = process.env.APP_DB_USERNAME || 'fruits_app';
const APP_DB_PASSWORD = process.env.APP_DB_PASSWORD;

if (!APP_DB_PASSWORD) {
  console.error('APP_DB_PASSWORD environment variable is required');
  process.exit(1);
}
const BACKUP_DIR = process.env.BACKUP_DIR || '/app/backups';

const MONGO_URI = `mongodb://${APP_DB_USERNAME}:${APP_DB_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=${MONGO_DB}`;
const execFileAsync = promisify(execFile);

const fruitSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  qty: Number,
  rating: Number,
  microsieverts: Number
});

const Fruit = mongoose.model('Fruit', fruitSchema, 'fruits');

async function buildInventoryBulkOperations(submittedValues, requireAllFields = true) {
  const fruits = await Fruit.find({}, { _id: 1 }).lean();
  const bulkOperations = [];

  for (const fruit of fruits) {
    const fieldName = `fruit-${fruit._id}`;
    const submittedValue = submittedValues[fieldName];

    if (submittedValue === undefined) {
      if (requireAllFields) {
        throw new Error(`Missing quantity for ${fieldName}`);
      }

      continue;
    }

    const parsedQty = Number.parseInt(submittedValue, 10);

    if (!Number.isInteger(parsedQty) || parsedQty < 0) {
      const validationError = new Error('INVALID_FRUIT_QTY');
      validationError.code = 'INVALID_FRUIT_QTY';
      throw validationError;
    }

    bulkOperations.push({
      updateOne: {
        filter: { _id: fruit._id },
        update: { $set: { qty: parsedQty } }
      }
    });
  }

  return bulkOperations;
}

function formatBackupTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function parseBackupFileName(fileName) {
  const match = /^backup-(\d+)-(.+)\.archive\.gz$/.exec(fileName);

  if (!match) {
    return null;
  }

  return {
    fileName,
    number: Number.parseInt(match[1], 10),
    timestamp: match[2]
  };
}

async function listBackups() {
  await mkdir(BACKUP_DIR, { recursive: true });
  const entries = await readdir(BACKUP_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => parseBackupFileName(entry.name))
    .filter(Boolean)
    .sort((left, right) => right.number - left.number);
}

async function createNextBackupFileName() {
  const backups = await listBackups();
  const nextNumber = backups.length > 0 ? backups[0].number + 1 : 1;
  const timestamp = formatBackupTimestamp();

  return `backup-${nextNumber}-${timestamp}.archive.gz`;
}

function renderInventoryPage(fruits, backups, notice) {
  const fruitRows = fruits.length > 0
    ? fruits
      .map((fruit) => `
        <li class="fruit-row">
          <div class="fruit-copy">
            <span class="fruit-name">${fruit.name}</span>
            <span class="fruit-note">Change the quantity and save it below.</span>
          </div>
          <div class="fruit-actions">
            <button type="button" class="stepper" data-target="qty-${fruit._id}" aria-label="Decrease ${fruit.name} quantity">-</button>
            <input
              id="qty-${fruit._id}"
              class="qty-input"
              type="number"
              min="0"
              name="fruit-${fruit._id}"
              value="${fruit.qty}"
              autocomplete="off"
              aria-label="${fruit.name} quantity"
            >
            <button type="button" class="stepper" data-target="qty-${fruit._id}" data-direction="up" aria-label="Increase ${fruit.name} quantity">+</button>
          </div>
        </li>
      `)
      .join('')
    : `
      <li class="empty-state">
        No fruit records are currently loaded. You can restore one of the saved backups below.
      </li>
    `;

  const backupOptions = backups.length > 0
    ? backups
      .map((backup) => `
        <option value="${backup.fileName}">
          Backup ${backup.number} - ${backup.timestamp}
        </option>
      `)
      .join('')
    : '<option value="">No backups found yet</option>';

  const backupListSize = Math.min(Math.max(backups.length, 3), 8);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Octopus Fruits App</title>
        <style>
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            min-height: 100vh;
            background:
              radial-gradient(circle at top left, #ffe5c2, transparent 32%),
              linear-gradient(180deg, #fffaf3 0%, #fff2df 100%);
            color: #222;
          }

          .shell {
            max-width: 860px;
            margin: 0 auto;
            padding: 40px 20px;
          }

          .card {
            padding: 28px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.94);
            border: 1px solid #f1d7b8;
            box-shadow: 0 18px 50px rgba(143, 63, 8, 0.12);
          }

          h1 {
            margin: 8px 0 10px;
            color: #8f3f08;
            font-size: clamp(2rem, 4vw, 2.8rem);
          }

          .eyebrow {
            margin: 0;
            font-size: 0.95rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #c45b12;
          }

          .intro {
            margin: 0 0 28px;
            font-size: 1.05rem;
            line-height: 1.6;
          }

          .inventory {
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            gap: 14px;
          }

          .fruit-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 18px 20px;
            border-radius: 16px;
            background: #fff7ee;
            border: 1px solid #f4dcc0;
          }

          .fruit-copy {
            display: grid;
            gap: 4px;
          }

          .fruit-name {
            font-size: 1.2rem;
            font-weight: 700;
            text-transform: capitalize;
            color: #7a3306;
          }

          .fruit-note {
            color: #6d5a4a;
          }

          .fruit-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            margin-left: auto;
          }

          button {
            width: 44px;
            height: 44px;
            border: none;
            border-radius: 12px;
            font-size: 1.4rem;
            font-weight: 700;
            cursor: pointer;
            color: #fff;
            background: linear-gradient(180deg, #d96d1f 0%, #b84f09 100%);
            box-shadow: 0 8px 18px rgba(184, 79, 9, 0.24);
          }

          button:hover {
            filter: brightness(1.05);
          }

          button:active {
            transform: translateY(1px);
          }

          .qty-input {
            width: 92px;
            height: 44px;
            border: 1px solid #d9b995;
            border-radius: 12px;
            text-align: center;
            font-size: 1rem;
            font-weight: 700;
            color: #7a3306;
            background: #fff;
          }

          .save-panel,
          .backup-panel {
            display: flex;
            justify-content: flex-end;
            margin-top: 22px;
          }

          .empty-state {
            padding: 18px 20px;
            border-radius: 16px;
            color: #6d5a4a;
            background: #fff7ee;
            border: 1px dashed #d9b995;
            line-height: 1.6;
          }

          .save-button {
            width: auto;
            min-width: 240px;
            padding: 0 18px;
            font-size: 1rem;
          }

          .restore-panel {
            margin-top: 26px;
            padding-top: 22px;
            border-top: 1px solid #f1d7b8;
          }

          .restore-form {
            display: flex;
            align-items: flex-end;
            gap: 12px;
            flex-wrap: wrap;
          }

          .restore-copy {
            margin: 0 0 14px;
            color: #6d5a4a;
            line-height: 1.5;
          }

          .restore-field {
            display: grid;
            gap: 8px;
            width: 100%;
          }

          .restore-label {
            font-size: 0.95rem;
            font-weight: 700;
            color: #7a3306;
          }

          .restore-select {
            width: 100%;
            border: 1px solid #d9b995;
            border-radius: 12px;
            background: #fff;
            color: #4d3c2d;
            padding: 8px;
          }

          .notice {
            margin: 0 0 18px;
            padding: 14px 16px;
            border-radius: 14px;
            font-size: 0.98rem;
          }

          .notice-success {
            color: #245c2f;
            background: #e7f7ea;
            border: 1px solid #bfe5c6;
          }

          .notice-error {
            color: #8c2f1b;
            background: #fff0eb;
            border: 1px solid #f0c5b6;
          }

          @media (max-width: 640px) {
            .fruit-row {
              align-items: flex-start;
              flex-direction: column;
            }

            .fruit-actions {
              width: 100%;
            }

            .restore-form {
              align-items: stretch;
            }
          }
        </style>
      </head>
      <body>
        <main class="shell">
          <section class="card">
            <p class="eyebrow">Octopus inventory</p>
            <h1>Fruit Inventory</h1>
            ${notice ? `<p class="notice notice-${notice.type}">${notice.text}</p>` : ''}
            <p class="intro">Update the numbers on the right, save them to MongoDB, and create or restore numbered backups from the list below.</p>
            <form id="inventoryForm" method="post" action="/inventory/save" autocomplete="off">
              <ul class="inventory">
                ${fruitRows}
              </ul>
              <div class="save-panel">
                <button class="save-button" type="submit" ${fruits.length === 0 ? 'disabled' : ''}>Save Inventory To MongoDB</button>
              </div>
              <div class="backup-panel">
                <button class="save-button" type="submit" formaction="/inventory/backup">Create New Backup In backups/</button>
              </div>
            </form>
            <section class="restore-panel">
              <p class="restore-copy">Restore one of the saved MongoDB backups below. Backups are listed by backup number and timestamp, so this works the same way on EC2 without browsing for a file in a GUI.</p>
              <form class="restore-form" method="post" action="/inventory/restore">
                <div class="restore-field">
                  <label class="restore-label" for="backupFile">Saved Backups</label>
                  <select
                    class="restore-select"
                    id="backupFile"
                    name="backupFile"
                    size="${backupListSize}"
                    ${backups.length === 0 ? 'disabled' : ''}
                    required
                  >
                    ${backupOptions}
                  </select>
                </div>
                <button class="save-button" type="submit" ${backups.length === 0 ? 'disabled' : ''}>Restore Selected Backup</button>
              </form>
            </section>
          </section>
        </main>
        <script>
          const inventoryForm = document.getElementById('inventoryForm');
          const stepperButtons = document.querySelectorAll('.stepper');

          if (inventoryForm) {
            // Reset browser-restored field values back to the Mongo-backed HTML values.
            inventoryForm.reset();
          }

          stepperButtons.forEach((button) => {
            button.addEventListener('click', () => {
              const input = document.getElementById(button.dataset.target);
              if (!input) {
                return;
              }

              const currentValue = Number(input.value) || 0;
              const nextValue = button.dataset.direction === 'up'
                ? currentValue + 1
                : Math.max(0, currentValue - 1);

              input.value = nextValue;
            });
          });
        </script>
      </body>
    </html>
  `;
}

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
    const [fruits, backups] = await Promise.all([
      Fruit.find().sort({ _id: 1 }).lean(),
      listBackups()
    ]);

    const noticeMap = {
      backupSuccess: {
        type: 'success',
        text: 'A new MongoDB backup was created in the backups folder.'
      },
      backupFailed: {
        type: 'error',
        text: 'The backup could not be created. Check the app logs for details.'
      },
      restoreSuccess: {
        type: 'success',
        text: 'The selected MongoDB backup was restored successfully.'
      },
      restoreMissingSelection: {
        type: 'error',
        text: 'Choose one of the saved backups before restoring.'
      },
      restoreInvalidSelection: {
        type: 'error',
        text: 'The selected backup was not found in the backups folder.'
      },
      restoreFailed: {
        type: 'error',
        text: 'The selected backup could not be restored. Check the app logs for details.'
      }
    };
    const notice = noticeMap[req.query.status] || null;

    return res.send(renderInventoryPage(fruits, backups, notice));
  } catch (error) {
    console.error('Failed to load fruit data:', error);
    return res.status(500).send('Application could not load data from MongoDB.');
  }
});

app.post('/inventory/save', async (req, res) => {
  try {
    const bulkOperations = await buildInventoryBulkOperations(req.body, true);

    if (bulkOperations.length > 0) {
      await Fruit.bulkWrite(bulkOperations);
    }

    return res.redirect('/');
  } catch (error) {
    if (error.code === 'INVALID_FRUIT_QTY') {
      return res.status(400).send('Each fruit quantity must be a whole number greater than or equal to zero.');
    }

    console.error('Failed to save fruit inventory:', error);
    return res.status(500).send('Application could not save the fruit inventory.');
  }
});

app.post('/inventory/backup', async (req, res) => {
  if (!APP_DB_USERNAME || !APP_DB_PASSWORD) {
    console.error('MongoDB app credentials are required for backup operations.');
    return res.status(500).send('Backup is not configured correctly.');
  }

  try {
    const bulkOperations = await buildInventoryBulkOperations(req.body, false);

    if (bulkOperations.length > 0) {
      await Fruit.bulkWrite(bulkOperations);
    }

    await mkdir(BACKUP_DIR, { recursive: true });
    const backupFileName = await createNextBackupFileName();
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    await execFileAsync('mongodump', [
      '--host', MONGO_HOST,
      '--port', MONGO_PORT,
      '--username', APP_DB_USERNAME,
      '--password', APP_DB_PASSWORD,
      '--authenticationDatabase', MONGO_DB,
      '--db', MONGO_DB,
      `--archive=${backupPath}`,
      '--gzip'
    ]);

    return res.redirect('/?status=backupSuccess');
  } catch (error) {
    if (error.code === 'INVALID_FRUIT_QTY') {
      return res.status(400).send('Each fruit quantity must be a whole number greater than or equal to zero.');
    }

    console.error('Failed to create MongoDB backup:', error.stderr || error);
    return res.redirect('/?status=backupFailed');
  }
});

app.post('/inventory/restore', async (req, res) => {
  if (!APP_DB_USERNAME || !APP_DB_PASSWORD) {
    console.error('MongoDB app credentials are required for restore operations.');
    return res.status(500).send('Restore is not configured correctly.');
  }

  const selectedBackup = req.body.backupFile;

  if (!selectedBackup) {
    return res.redirect('/?status=restoreMissingSelection');
  }

  try {
    const backups = await listBackups();
    const backupMatch = backups.find((backup) => backup.fileName === selectedBackup);

    if (!backupMatch) {
      return res.redirect('/?status=restoreInvalidSelection');
    }

    const backupPath = path.join(BACKUP_DIR, backupMatch.fileName);

    await execFileAsync('mongorestore', [
      '--host', MONGO_HOST,
      '--port', MONGO_PORT,
      '--username', APP_DB_USERNAME,
      '--password', APP_DB_PASSWORD,
      '--authenticationDatabase', MONGO_DB,
      '--db', MONGO_DB,
      `--archive=${backupPath}`,
      '--gzip',
      '--drop'
    ]);

    return res.redirect('/?status=restoreSuccess');
  } catch (error) {
    console.error('Failed to restore MongoDB backup:', error.stderr || error);
    return res.redirect('/?status=restoreFailed');
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
