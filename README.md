# Triply — Travel Planner

Triply is a travel planning web application built with React, Vite, Node.js, Express, and PostgreSQL. It helps users organize trips and manage their itineraries in one place.

## Features

- Create and manage trips
- Edit trip details
- Delete trips
- Add itinerary activities with dates, times, locations, and notes
- View saved trips and itinerary activities
- Responsive user interface
- PostgreSQL database integration

## Tech Stack

**Frontend**
- React
- Vite
- CSS

**Backend**
- Node.js
- Express.js
- PostgreSQL

## Project Structure

```text
trip-planner/
├── public/
├── server/
│   └── server.js
├── src/
│   ├── App.jsx
│   └── index.css
├── index.html
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git (optional, for version control)

## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd trip-planner
```

If you already have the project on your computer, open its folder in VS Code and skip this step.

### 2. Install frontend dependencies

Run these commands from the project root:

```bash
npm install
```

### 3. Configure the backend

Open a terminal in VS Code and navigate to the server directory:

```powershell
cd server
```

Install backend dependencies:

```powershell
npm install
```

Configure your PostgreSQL connection settings as required by your backend code. Keep passwords and other secrets in environment variables or a local `.env` file. Never commit credentials to GitHub.

Make sure PostgreSQL is running and the required database and tables have been created.

### 4. Start the backend

From the `server` directory, run:

```powershell
node server.js
```

The backend should start at:

```text
http://localhost:5000
```

Keep this terminal running.

### 5. Start the frontend

Open a **second terminal** in VS Code and navigate to the project root:

```powershell
cd C:\Users\HP\Desktop\trip-planner
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

Keep both frontend and backend terminals running while using the application.

## Available Frontend Commands

Run these commands from the project root.

| Command | Description |
|---|---|
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start the development server |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

## Backend API

The backend runs on `http://localhost:5000`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check whether the API is running |
| GET | `/api/trips` | Retrieve trips |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/:id` | Retrieve a trip by ID |
| PUT | `/api/trips/:id` | Update a trip |
| GET | `/api/trips/:tripId/activities` | Retrieve a trip's activities |
| POST | `/api/trips/:tripId/activities` | Add an itinerary activity |

Additional endpoints may be available depending on the backend implementation.

## Database

Triply uses PostgreSQL. The database must be configured locally or through your deployment environment.

Keep database credentials private. Do not upload `.env` files, passwords, or other secrets to a public repository.

## Development Notes

- Run the frontend and backend in separate terminals.
- Ensure PostgreSQL is running before testing database-backed features.
- Configure the frontend API URL appropriately when deploying.
- Set production environment variables on your hosting provider.

## License

No license has been specified yet.
