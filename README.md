## Slack Connect — Scheduler App

Slack Connect is a full-stack application (Node.js + Express + React + TypeScript) that lets you:

🔑 Connect to your Slack workspace

💬 Send messages immediately to a channel

⏰ Schedule messages for future delivery

📋 View, cancel, or delete scheduled messages

## Tech Stack

Backend: Node.js, Express, TypeScript

Frontend: React, TypeScript, Axios

Database: Simple JSON file (db.json)

Slack API: chat.postMessage, chat.scheduleMessage, conversations.list

## Prerequisites

Node.js
 (v18+)

npm or yarn

A Slack App
 with these Bot Token Scopes:

chat:write

channels:read

chat:write.customize

(optional for history: channels:history)

## Important: Add your bot to each Slack channel you want to send messages to.

<!-- Failed to upload "slack.mp4" -->

## Getting Started
1. Clone the repo
git clone https://github.com/your-username/slack-connect.git
cd slack-connect

2. Setup backend
cd backend
npm install


Create a .env file inside backend/:

PORT=4000
BASE_URL=http://localhost:4000
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
DB_FILE=./db.json


Run backend:

npm run dev


Server runs at 👉 http://localhost:4000

3. Setup frontend
cd ../frontend
npm install
npm start


Frontend runs at 👉 http://localhost:3000


## Frontend Link- https://slack-connect-frontend1-lq5j.onrender.com/
## Backend Link- https://slack-connect-h0o6.onrender.com

<img width="1909" height="1026" alt="Image" src="https://github.com/user-attachments/assets/ac39f71b-58db-4de5-b7c2-c86cdacb3603" />

## Usage

Go to the frontend UI (http://localhost:3000)

Select a channel from the dropdown

Type your message

Choose to Send Now or Schedule with a date/time

Manage scheduled messages (cancel or delete) from the sidebar list

## API Endpoints

Backend provides REST endpoints at http://localhost:4000/api:

GET /channels → list Slack channels

POST /messages/send → send a message immediately

POST /messages/schedule → schedule a message

GET /messages/scheduled → list scheduled messages

DELETE /messages/scheduled/:id → cancel/delete scheduled message


Rotate your Slack tokens if they ever leak.
