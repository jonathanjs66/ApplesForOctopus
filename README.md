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

## Technologies Used

- Node.js
- Express
- MongoDB
- Mongoose
- Nginx
- Docker
- Docker Compose
- GitHub Actions

## Project Structure

```text
.
├── app
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── mongo
│   ├── Dockerfile
│   └── init.js
├── nginx
│   ├── Dockerfile
│   └── nginx.conf
├── .github
│   └── workflows
│       └── ci.yml
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
