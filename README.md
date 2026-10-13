# Triply — Travel Planner

Plan your next adventure with Triply! Save your trips, organize destinations and dates, and manage your travel plans in one place.

**Live Website:** https://triply-travel-planner.vercel.app/

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Neon PostgreSQL
- Authentication: Express sessions + Argon2 password hashing
- Deployment: Vercel
- Repository: https://github.com/duashah110/triply-travel-planner

## Prerequisites

Install these before running the project:

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (included with Node.js)
- Git
- A configured Neon PostgreSQL database

Check your installation:

```powershell
node --version
npm --version
git --version
```

## 1. Open the Project

Open PowerShell and run:

```powershell
cd C:\Users\HP\Desktop\trip-planner
```

If you are using a different computer, clone the repository first:

```powershell
git clone https://github.com/duashah110/triply-travel-planner.git
cd triply-travel-planner
```

To get the latest GitHub changes in an existing project:

```powershell
git pull --rebase origin main
```

## 2. Install Dependencies

Run these commands from the project root:

```powershell
npm install
cd server
npm install
cd ..
```

## 3. Configure Environment Variables

Create a file named `.env` inside the `server` folder:

`server/.env`

Add these variables:

```env
DATABASE_URL=YOUR_NEON_POSTGRESQL_CONNECTION_STRING
SESSION_SECRET=YOUR_PRIVATE_RANDOM_SECRET
```

Replace the placeholders with your own values. Do not use the placeholder text as actual credentials.

Generate a secure session secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep `.env` private. Never commit database credentials or session secrets to GitHub.

## 4. Run the Backend

Open **Terminal 1** in VS Code or PowerShell:

```powershell
cd C:\Users\HP\Desktop\trip-planner\server
node server.js
```

The backend should display a message similar to:

```text
Triply API running on http://localhost:5000
Neon database connected successfully
```

Keep this terminal running.

**Note:** The backend currently starts with `node server.js`; `npm run dev` is not configured in the server folder.

## 5. Run the Frontend

Open **Terminal 2** in a separate terminal window:

```powershell
cd C:\Users\HP\Desktop\trip-planner
npm run dev
```

Open the local URL printed by Vite in your browser. It is commonly `http://localhost:5173` or another available port.

Keep both terminals running while using the local app.

## 6. Authentication and Database

- Create an account or log in through the app.
- Authenticated trips should be associated with the signed-in user.
- Test that one user's trips are not visible to another user.
- The backend requires `DATABASE_URL` and `SESSION_SECRET`.
- If authentication fails, check the backend terminal and verify the environment variables.

## 7. Push Changes to GitHub

Before starting new work, get the latest changes:

```powershell
git pull --rebase origin main
```

After editing and testing your code:

```powershell
git status
git add .
git commit -m "Describe your changes"
git push origin main
```

If Git reports a conflict, stop and resolve it before pushing. Do not use `git push --force` as a shortcut.

Before running `git add .`, make sure `.env`, passwords, API keys, and other secrets are not being committed.

## 8. Deployment on Vercel

The production website is:

https://triply-travel-planner.vercel.app/

The project is connected to GitHub. Pushing changes to the `main` branch can trigger a Vercel deployment.

In Vercel, configure the following environment variables for the **Production** environment:

- `DATABASE_URL`
- `SESSION_SECRET`

Use private, valid values. After changing environment variables, redeploy so the changes take effect.

Check that the deployment status is **Ready**, then test signup, login, trip creation, logout, and account-specific trip visibility on the live website.

## Troubleshooting

### `npm run dev` says “Missing script: dev”

For the backend, run:

```powershell
cd server
node server.js
```

For the frontend, run `npm run dev` from the project root.

### `SESSION_SECRET is missing from environment variables`

Check that `SESSION_SECRET` exists in `server/.env` for local development and in Vercel's Production environment for the live website.

### `Request failed (500)`

Check the backend terminal for local errors or Vercel Runtime Logs for production errors. Verify the environment variables and database connection.

### Neon database connection fails

Check that `DATABASE_URL` is correct, the database is reachable, and the connection settings are valid.

---

**Project:** Triply Travel Planner  
**Repository:** https://github.com/duashah110/triply-travel-planner  
**Live App:** https://triply-travel-planner.vercel.app/
