# MovieTime Backend

Spring Boot 4.2.0 REST & WebSocket backend for MovieTime, running on **Java 25**.

---

## Tech Stack

- **Java 25** & **Spring Boot 4.2.0** (Web, Security, Data JPA, WebSocket, Validation)
- **Supabase PostgreSQL** (`public.users` + `movies`, `shows`, `reviews`, `sessions`, `bookings`)
- **Redis** for session caching and JWT access token blacklisting on logout
- **JJWT 0.12.6** for 15-minute access tokens + 30-day refresh tokens

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `8080` |
| `SUPABASE_DB_URL` | PostgreSQL JDBC URL (Session Pooler recommended) | `jdbc:postgresql://localhost:5432/movietime?sslmode=require` |
| `SUPABASE_DB_USER` | Database username | `postgres` |
| `SUPABASE_DB_PASSWORD` | Database password | — |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | empty |
| `JWT_SECRET` | HMAC secret (min 256-bit) | dev default |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173,http://127.0.0.1:5173` |

---

## Run Locally

```bash
export SUPABASE_DB_URL="jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require"
export SUPABASE_DB_USER="<your-supabase-user>"
export SUPABASE_DB_PASSWORD="<your-supabase-password>"
./mvnw spring-boot:run
```

On startup, `schema.sql` ensures tables exist and `DataSeeder` seeds demo users, movies, shows, reviews, and a sample booking.

---

## Key Endpoints

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- **Movies:** `GET /api/movies`, `GET /api/movies/{slug}`, `POST /api/movies/{id}/reviews`
- **Shows & Seats:** `GET /api/shows/{id}`, `POST /api/shows/{id}/seats/lock`, `POST /api/shows/{id}/seats/unlock`, `POST /api/shows/{id}/book`
- **Bookings:** `GET /api/bookings/my`
- **Admin (`ROLE_ADMIN`):** `POST/DELETE /api/admin/movies`, `POST/DELETE /api/admin/shows`
- **WebSocket:** `ws://localhost:8080/ws` → subscribe to `/topic/shows/{showId}/seats`
