# Octopus Fruits App

Containerized "hello world" web application for the Octopus exercise. The stack uses Node.js, MongoDB, and Nginx, with each component running in its own container.

## Overview

This project provisions a small web application that reads fruit inventory data from MongoDB and displays the number of apples in stock on an HTML page.

## Architecture

The application is composed of three containers:

- `nginx`: public entrypoint on port `80`
- `app`: Node.js / Express web application
- `mongodb`: MongoDB database seeded at startup

Request flow:

`Browser -> Nginx -> Node.js App -> MongoDB`

## Backup And Restore

The project includes simple MongoDB backup and restore scripts for operational recovery.

Backups are stored on the host machine under the `backups/` directory and are not committed to Git.

### Create A Backup

Make sure the stack is running, then run:

```bash
./scripts/backup.sh


### Visual Architecture

```mermaid
flowchart LR
    Browser --> Nginx[nginx container]
    Nginx --> App[node.js app container]
    App --> Mongo[(mongodb container)]
.
├── app
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── mongo
│   ├── Dockerfile
│   ├── init.js
│   └── ensure-app-user.js
├── nginx
│   ├── Dockerfile
│   └── nginx.conf
├── .github
│   └── workflows
│       └── cicd.yml
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
