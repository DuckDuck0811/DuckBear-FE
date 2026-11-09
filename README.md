# DuckBear

DuckBear is an online learning platform with a Vue web application and a NestJS API. It supports learning materials, assignments, classes, student progress, and real-time classroom notifications.

This repository contains the frontend. The backend is maintained separately and requires PostgreSQL.

## Project Components

| Component | Technology | Purpose |
| --- | --- | --- |
| Frontend (this repository) | Vue 3, Vite, Vuetify, Pinia | Web application for students, teachers, and administrators |
| Backend (`BE`) | NestJS, Prisma, PostgreSQL | REST API, authentication, data storage, and real-time events |

## Prerequisites

- Node.js and npm
- PostgreSQL for the backend
- The DuckBear backend repository, available at `BE` alongside this frontend repository

## Quick Start

Start the backend and frontend in separate terminals. The commands below assume the workspace contains sibling `BE` and `FE` directories, with this frontend repository at `FE/FE`.

### 1. Configure and start the backend

From the workspace root:

```powershell
cd BE
npm ci
```

Create `BE/.env` and configure at least `DATABASE_URL` and `JWT_SECRET`. Optional question-generation settings are documented in the backend README.

Generate the Prisma client, apply development migrations, and start the API:

```powershell
npx prisma generate
npx prisma migrate dev
npm run dev
```

The API listens on `http://localhost:3000` by default.

### 2. Configure and start the frontend

In another terminal, from the workspace root:

```powershell
cd FE/FE
npm ci
npm run dev
```

Vite prints the local URL to open in your browser. The frontend uses `http://localhost:3000` as its default API URL. To use a different backend URL, set `VITE_API_BASE_URL` in the frontend `.env` file before starting Vite:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

## Common Commands

Run commands from the corresponding project directory.

| Project | Command | Description |
| --- | --- | --- |
| Frontend | `npm run dev` | Start the Vite development server |
| Frontend | `npm test` | Run frontend tests |
| Frontend | `npm run build` | Build the frontend into `dist/` |
| Frontend | `npm run preview` | Preview the production build locally |
| Backend | `npm run dev` | Start the NestJS API in watch mode |
| Backend | `npm test` | Run backend unit tests |
| Backend | `npm run test:e2e` | Run backend end-to-end tests |
| Backend | `npm run build` | Build the backend |

## Frontend Routes

| Route | Page |
| --- | --- |
| `/login` | Sign in and registration |
| `/` | Book catalogue |
| `/books/:id` | Book details, chapters, and lessons |
| `/lessons/:id` | Lesson content |
| Other routes | Not found |

Routes other than `/login` require an access token. The frontend stores the token and user information in `localStorage` and returns to the login page when the session expires.

## Frontend Source Structure

```text
src/
├── components/   # Shared and feature-specific UI components
├── plugins/      # Plugins, including internationalization
├── router/       # Application routes
├── services/     # API client and other services
├── stores/       # Pinia application and authentication state
├── views/        # Application pages
├── App.vue       # Root component
├── main.js       # Vue, Pinia, Router, and Vuetify setup
└── style.css     # Global styles
```

## Backend and API Configuration

Set `VITE_API_BASE_URL` to the backend URL before running or building the frontend. For a local backend, use:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

The backend must be running and allow requests from the frontend through CORS. Keep environment files and credentials private.
