# MovieTime Frontend

React + Vite frontend for MovieTime, styled with **Tailwind CSS v4** and **Lucide React** icons in a clean light-mode UI.

---

## Tech Stack

- **React 19** & **Vite 8**
- **React Router 7**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Lucide React** icons
- **@stomp/stompjs** for real-time WebSocket seat updates

---

## Environment Variables (Optional)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend REST base URL | `http://localhost:8080` |
| `VITE_WS_URL` | Backend WebSocket URL | `ws://localhost:8080/ws` |

---

## Scripts

```bash
npm install     # Install dependencies
npm run dev     # Start dev server on http://localhost:5173
npm run build   # Production build to dist/
npm run lint    # Run ESLint
```

---

## Pages

- `/` — Browse movies with search & genre filter
- `/movies/:slug` — Movie details, showtimes, and reviews
- `/shows/:showId/book` — Live seat map (WebSocket), confirmation & simulated payment
- `/my-tickets` — User's confirmed bookings
- `/admin` — Admin dashboard for managing movies and shows
- `/login`, `/register` — Authentication with automatic JWT refresh
