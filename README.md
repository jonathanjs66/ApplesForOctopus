# Octopus Fruits App

Containerized "hello Apple" web application for the Octopus exercise. The stack uses Node.js, MongoDB, and Nginx, with each component running in its own container.

## Overview

This project requierment was to provisions a small web application that reads fruit inventory data from MongoDB and displays the number of apples in stock on an HTML page.
my idea:
1) was to expand the display to show inventory of all fruits, everytime we open or close the container we go back to the original number of fruit beacuse they are hardcoded in the database, the next step would be to save the data from out of the container and push the new values in once they are uploaded
2) add a backup script:  
I created a button that backs up any changes that i made in the values, and another button to restore the backed up values on /backups
and added a button that keeps the values in tact after reboot as long as the volume is not deleted on data/db
3) use cd as an ssh to ec2:
i made a file that everytime the ec2 restart it will automatically go to the app folder and docker compose it at
/etc/systemd/system/octopus-app.service

4) password lifeycle
I separated the MongoDB users by responsibility. The admin user is kept for database initialization, deployment, and user management, and it is not passed into the application container. The application itself connects with the app database user, and backup/restore now also use that same app user instead of the admin credential. This keeps the design simpler while still reducing risk, because a compromise of the web app does not expose the MongoDB admin password.
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
