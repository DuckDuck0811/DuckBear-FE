# DuckBear Frontend

Vue 3 web app for DuckBear Classroom. The NestJS API and PostgreSQL database live in the sibling `BE` directory.

## Requirements

- Node.js compatible with Vite 8 (`^20.19.0` or `>=22.12.0`)
- npm
- A running DuckBear backend for data-backed features

## Run locally

Start the backend using [`BE/README.md`](../../BE/README.md), then open a second terminal in `FE/FE`:

```sh
npm ci
npm run dev
```

Vite prints the local URL when it starts. The app uses `http://localhost:3000` as its API by default. To change it, create `.env.local` in `FE/FE`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

For Google sign-in, use the same OAuth client ID as `GOOGLE_CLIENT_ID` in the backend. Restart Vite after changing environment variables. The backend must allow requests from the frontend origin through CORS.

## Scripts

Run from `FE/FE`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Node.js test suite |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## Routes

The router requires a signed-in user for app pages and redirects users who do not have the required role. Public account routes are login, registration, and password recovery.

| Route | Purpose | Access |
| --- | --- | --- |
| `/login`, `/ops/7f3a9c/entry` | Sign in (including the admin entry) | Public |
| `/register`, `/register/:role` | Choose a role or register | Public |
| `/forgot-password`, `/reset-password` | Recover an account | Public |
| `/` and `/books/:id`, `/lessons/:id` | Browse books and study lessons | Signed-in users |
| `/student`, `/results` | Student dashboard and attempt history | Students |
| `/student/notebook`, `/student/notebook/review` | Review saved questions | Students |
| `/student/leaderboard`, `/student/assistant` | Leaderboard and learning assistant | Students |
| `/student/practice`, `/student/practice/session/:id` | Practice sessions | Students |
| `/classes`, `/classes/:id` | Class list and class details | Signed-in users; detail for teachers/admins |
| `/manual-assignments`, `/classes/:id/manual-assignments` | Manual class assignments | Students, teachers, admins |
| `/assignments`, `/assignments/:id/do` | Assignments and taking an assignment | Signed-in users; taking for students |
| `/submissions`, `/submissions/:assignmentId` | Review assignment submissions | Teachers/admins; detail for teachers |
| `/question-bank`, `/exam-bank` | Manage questions and exams | Teachers/admins |
| `/schedule`, `/teacher/progress`, `/activity-log` | Schedule, progress, and assignment activity | Role-limited |
| `/profile`, `/admin/accounts` | Profile and account management | Signed-in users; accounts for admins |

## Project structure

```text
src/
├── components/   # Shared UI and feature components
├── composables/  # Reusable Vue composition logic
├── i18n/         # Vietnamese and English messages
├── layouts/      # Page layouts
├── router/       # Routes and navigation guard
├── services/     # API client and domain services
├── stores/       # Pinia state
├── styles/       # App styles
├── utils/        # Shared utilities
├── views/        # Route-level pages
├── App.vue
└── main.js       # Vue, router, Pinia, Vuetify, and i18n setup
```

## Production build

Set `VITE_API_BASE_URL` to the deployed API origin before building:

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host configured to serve `index.html` for app routes, and configure the backend CORS policy to allow the deployed frontend origin. The access token, user session, and language preference are stored in browser `localStorage`.
