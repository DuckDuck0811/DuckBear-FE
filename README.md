# DuckBear Frontend

DuckBear is a learning platform for students and teachers. This project contains the Vue 3 web application; the NestJS API and PostgreSQL database are maintained in the sibling `BE` project in the development workspace.

## What’s included

- Student and teacher experiences for books, lessons, classes, assignments, schedules, and progress.
- Question and exam banks, assignment play modes, and submission review.
- Vietnamese and English translations, with Vietnamese as the default language.
- Role-aware navigation backed by an authenticated API.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by Vite 8)
- npm
- A running DuckBear backend for data-backed features

## Run locally

Start the backend first. Follow its setup instructions in `BE/README.md` from the workspace root, then start the frontend in a second terminal:

```sh
cd FE/FE
npm ci
npm run dev
```

Open the local URL printed by Vite. The frontend expects the API at `http://localhost:3000` by default. To use another API URL, create `.env.local` in this directory:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Restart Vite after changing environment variables. The backend must be running and accept browser requests through CORS.

## Scripts

Run these from `FE/FE`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Node.js test suite |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## Application routes

All routes require a signed-in user except `/login` and `/register`. Some routes are limited to specific roles; unauthorized users are redirected to their role’s landing page.

| Route | Purpose | Roles |
| --- | --- | --- |
| `/login`, `/register`, `/register/:role` | Sign in and registration | Public |
| `/` | Browse books | Signed-in users |
| `/books/:id`, `/lessons/:id` | Book, chapter, and lesson content | Signed-in users |
| `/student`, `/results` | Student dashboard and attempt history | Students |
| `/classes`, `/classes/:id` | Classes and class details | Signed-in users; class details for teachers and admins |
| `/manual-assignments`, `/classes/:id/manual-assignments` | Class assignments | Teachers, admins, students |
| `/assignments`, `/assignments/:id/do` | Assignment list and taking an assignment | Teachers, admins, students; taking assignments for students |
| `/submissions`, `/submissions/:assignmentId` | Review submissions | Teachers |
| `/question-bank`, `/exam-bank` | Manage questions and exams | Teachers, admins |
| `/schedule` | Class schedule | Teachers, students |
| `/teacher/progress` | Student progress | Teachers, admins |
| `/activity-log` | Assignment activity | Teachers |
| `/profile` | Account profile | Admins, teachers, students |

## Project structure

```text
src/
├── components/   # Shared UI and feature components
├── composables/  # Reusable Vue composition logic
├── i18n/         # Locale setup and Vietnamese/English messages
├── layouts/      # Page layouts
├── router/       # Routes and navigation guard
├── schemas/      # Data schemas
├── services/     # API client and domain services
├── stores/       # Pinia state
├── styles/       # Additional styles
├── utils/        # Shared utilities
├── views/        # Route-level pages
├── App.vue       # Root component
└── main.js       # Vue, router, Pinia, Vuetify, and i18n setup
```

## Configuration and session behavior

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL for backend requests |

The app stores the access token, signed-in user, and language preference in browser `localStorage`. Clearing site storage signs the user out and resets the saved language preference. Keep local environment files and credentials out of version control.

## Production build

Set `VITE_API_BASE_URL` to the deployed API origin before building:

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static web host configured to serve `index.html` for application routes. Configure the backend’s CORS policy to allow the deployed frontend origin.
