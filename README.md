# ✈️ Triply — Travel Planner

**Pack the bag. Plan the days.**

Triply is a travel planning web application that helps you organize your trips, manage travel dates, and plan activities for your next adventure.

🌐 **Live Demo:** [triply-travel-planner.vercel.app](https://triply-travel-planner.vercel.app/)

---

## ✨ Features

- 🧳 **Create Trips** — Add trips with a title, destination, dates, and description.
- 🌍 **Manage Destinations** — Keep your travel plans organized by destination.
- 📅 **Plan Activities** — Add activities to your trips with dates, times, and locations.
- 🗂️ **View Your Trips** — Browse your saved trips in one place.
- ☁️ **Cloud Database** — Store trip information in PostgreSQL using Neon.
- 🚀 **Live Deployment** — Deployed on Vercel.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| Vite | Frontend development and build tooling |
| Node.js | Backend runtime |
| Express.js | REST API |
| PostgreSQL | Relational database |
| Neon | Hosted PostgreSQL database |
| Vercel | Deployment and hosting |
| Git & GitHub | Version control and source code hosting |

## 🔗 Live Application

👉 [Open Triply](https://triply-travel-planner.vercel.app/)

## 📸 How It Works

1. Open the live application.
2. Create a new trip.
3. Enter the trip title, destination, start date, and end date.
4. Save your trip.
5. Open the trip and add activities to plan your days.

## 🚀 Run Locally

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A PostgreSQL database, such as [Neon](https://neon.tech/)

### 1. Clone the repository

```bash
git clone https://github.com/duashah110/triply-travel-planner.git
cd triply-travel-planner
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server/` directory:

```env
DATABASE_URL=your_neon_postgresql_connection_string
PORT=5000
```

Replace the example database value with your own Neon connection string. **Never commit your real database credentials to GitHub.**

Make sure your Neon database contains the required tables: `users`, `trips`, and `activities`.

### 5. Start the backend

From the `server/` directory, run:

```bash
node server.js
```

### 6. Start the frontend

Open a **second terminal** in the project root directory and run:

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal, usually:

`http://localhost:5173`

> **Note:** Keep the backend and frontend terminals running while developing locally. If your project uses a different local API configuration, configure the frontend to point to your local backend.

## 🔌 API Endpoints

The application uses REST API endpoints to manage travel data.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/trips` | Retrieve trips |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/:id` | Retrieve a trip by ID, if implemented |
| PUT | `/api/trips/:id` | Update a trip, if implemented |
| DELETE | `/api/trips/:id` | Delete a trip, if implemented |
| GET/POST | `/api/activities` | Retrieve or create activities, depending on implementation |

> Endpoints marked “if implemented” should be checked against the current backend before use.

## 🗄️ Database

Triply uses PostgreSQL hosted on Neon.

The database stores information for:

- **Users** — User details.
- **Trips** — Trip titles, destinations, dates, and descriptions.
- **Activities** — Activities associated with trips, including dates, times, and locations.

Trips and activities use relational database constraints to maintain data integrity.

## 🌐 Deployment

- **Frontend and application:** [Vercel](https://vercel.com/)
- **Database:** [Neon](https://neon.tech/)
- **Source code:** [GitHub Repository](https://github.com/duashah110/triply-travel-planner)

### Deploy your own copy

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables in Vercel.
4. Confirm that your backend API routes are deployed and accessible.
5. Deploy the project and test trip and activity creation.

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string from Neon |
| `PORT` | Backend port for local development |

Keep all secrets in environment variables. Do not publish passwords, API keys, or database connection strings in source code or README files.

## 🗺️ Roadmap

- [ ] User registration and authentication
- [ ] Edit and delete trips
- [ ] Improved activity management
- [ ] Enhanced mobile experience
- [ ] More travel-planning features

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request.

## 👩‍💻 Author

**Dua Shah**

- GitHub: [@duashah110](https://github.com/duashah110)

---

> “Slow down. The view isn't going anywhere, but you are.”

**Made with ❤️ for better travel planning.**
