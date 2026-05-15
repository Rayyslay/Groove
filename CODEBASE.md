# Groove — Codebase Overview

A full-stack social media web app called **Groove**, built as an ASP.NET Core Web API (.NET 10) backend with a React 19 + Vite frontend, talking to a PostgreSQL database via Entity Framework Core. JWT-based auth, multipart file uploads for media, and a feed/explore/profile/follow/like/comment loop.

---

## 1. Repository Layout

```
ASP-.net/
├── Backend/                  # ASP.NET Core Web API (.NET 10)
│   ├── Controllers/          # Auth, Users, Posts
│   ├── Data/                 # AppDbContext (EF Core)
│   ├── DTOs/                 # Request validation DTOs
│   ├── Middlewares/          # Global exception handler
│   ├── Migrations/           # EF Core migrations
│   ├── Models/               # User, Post, Comment, Like, Follow
│   ├── Program.cs            # Startup, DI, JWT, CORS
│   ├── appsettings.json      # Connection string + JWT key
│   └── Backend.csproj
└── Frontend/                 # React 19 SPA (Vite)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx           # Top-level routes
        ├── main.jsx          # React root, axios 401 interceptor
        ├── context/          # AuthContext, ToastContext
        ├── components/       # Navbar, Sidebar, Footer, Toast, Loader, ProtectedRoute, ScrollToTopButton
        ├── pages/
        │   ├── Home.jsx, NotFound.jsx, FeedLayout.jsx
        │   ├── authorization/  # Login, Register, SetupProfile
        │   └── feed/           # Feed, Explore, Profile, Search, Settings, CreatePost
        ├── hooks/            # useScrollReveal
        ├── utils/            # cropImage (canvas helper)
        └── assets/Images/    # Profile pictures + post uploads
```

---

## 2. Backend (ASP.NET Core, .NET 10)

### 2.1 Configuration ([Backend/appsettings.json](Backend/appsettings.json))

- **Database:** PostgreSQL, DB `groove`, user `postgres` (password stored in plaintext — see Security notes).
- **JWT key:** Symmetric HMAC-SHA256 secret in `JwtSettings:JWTkey` (also committed in plaintext).
- **Logging:** Default `Information`, ASP.NET Core minimum `Warning`.

### 2.2 Startup ([Backend/Program.cs](Backend/Program.cs))

- `AddControllers()`, Swagger (dev only).
- **CORS policy `AllowFrontend`** permits `http://localhost:5173` and `:5174` (Vite default ports).
- **DbContext:** `AppDbContext` registered with `UseNpgsql`.
- **JWT bearer auth:**
  - `ValidateIssuer = false`, `ValidateAudience = false`, `ValidateLifetime = true`, signing key validated.
- Middleware order: `GlobalExceptionMiddleware` → HTTPS redirect → CORS → static files → `Authentication` → `Authorization` → controllers.
- Throws on missing JWT key at startup.

### 2.3 Data Model

**[Models/User.cs](Backend/Models/User.cs)** — `Id`, `Username`, `Email`, `PasswordHash`, `FirstName`, `LastName`, `ProfilePictureUrl?`, `Bio?`, `Gender?`, `DateOfBirth?`, `CreatedAt`, `UpdatedAt`, `LastLogin?`, `IsActive`, `IsDeleted`.

**[Models/Post.cs](Backend/Models/Post.cs)** — `Id`, `UserId`, `TextContent?`, `MediaUrl?`, `MediaType?` (`image`/`video`), `PostType` (`text`/`media`), `CreatedAt`, navigations to `Comments` and `Likes`.

**[Models/Comment.cs](Backend/Models/Comment.cs)** — `Id`, `PostId`, `UserId`, `Content`, `CreatedAt`.

**[Models/Like.cs](Backend/Models/Like.cs)** — `Id`, `PostId`, `UserId`, `CreatedAt`. Unique index on `(PostId, UserId)`.

**[Models/Follow.cs](Backend/Models/Follow.cs)** — `Id`, `FollowerId`, `FollowingId`, `CreatedAt`. Unique index on the pair.

### 2.4 DbContext ([Backend/Data/AppDbContext.cs](Backend/Data/AppDbContext.cs))

- Unique indexes on `User.Email` and `User.Username`.
- Default values for `IsActive`, `IsDeleted`, `CreatedAt`, `UpdatedAt`, `PostType="text"` via `HasDefaultValue` / `HasDefaultValueSql("NOW()")`.
- Cascade deletes from `Post → User`, `Comment → Post/User`, `Like → Post/User`, `Follow → User`.
- Length constraints (e.g., `Bio` 150, `TextContent` 256, `Comment.Content` 500, `MediaUrl` 500).

Migrations (in order): `InitialCreate`, `UpdateBioLength`, `AddPostsCommentsLikesFollows`, `AddGenderAndDateOfBirth`.

### 2.5 DTOs

- **[RegisterDto](Backend/DTOs/RegisterDto.cs)** — strict validators: username regex `^[A-Za-z0-9._-]+$` (4–50), email + max 100, password 8+ with upper/lower/digit/special, `ConfirmPassword` matches, names letters-only.
- **[LoginDto](Backend/DTOs/LoginDto.cs)** — email + password.
- **[CreatePostDto](Backend/DTOs/CreatePostDto.cs)** — `PostType` regex `^(text|media)$`, `TextContent` ≤ 256 (file handled directly as `IFormFile`).
- **[CreateCommentDto](Backend/DTOs/CreateCommentDto.cs)** — `Content` required, ≤ 500.

### 2.6 Controllers

#### [AuthController](Backend/Controllers/AuthController.cs) — `api/auth`
- `GET check-username?username=` / `GET check-email?email=` — async existence check (case-insensitive).
- `POST register` — validates DTO, ensures uniqueness, hashes password with `PasswordHasher<User>`, **auto-logs in** and returns JWT (7-day expiry) + user payload.
- `POST login` — verifies hashed password, returns JWT + user. Logs warnings on failure, info on success.

JWT claims: `NameIdentifier` (user id), `Name` (username), `Email`. Signed with HMAC-SHA256.

#### [UsersController](Backend/Controllers/UsersController.cs) — `api/users` (all `[Authorize]`)
- `GET search?q=&excludeSelf=` — case-insensitive `Contains` on username / first / last name, capped at 20 results, returns `isFollowing` per result.
- `POST {id}/follow` — toggles a Follow row; rejects self-follow.
- `GET me` — returns current user + counts (posts, followers, following) + post list (newest-first).
- `PUT me` (multipart) — updates first/last name, bio, gender (whitelisted: Male/Female/Other/PreferNotToSay), date of birth (UTC), username (with uniqueness check), and optional profile picture upload (≤ 5 MB, jpg/jpeg/png/gif/webp). Stores files in `Frontend/src/assets/Images/profilePictures` with a GUID name; URL stored as `/src/assets/...`.
- `GET {username}` — public profile lookup with the same counts + `isFollowing` for the caller and posts including each post's `isLiked` state.

#### [PostsController](Backend/Controllers/PostsController.cs) — `api/posts` (all `[Authorize]`)
- `GET feed?page=&size=` — posts from people the user follows, descending by `CreatedAt`, paginated. Returns `hasMore`.
- `GET explore?page=&size=` — newest posts globally, paginated.
- `POST` (multipart) — creates text or media post. Media ≤ 15 MB; images jpg/jpeg/png/gif/webp; videos mp4/webm/mov. File saved under `Frontend/src/assets/Images/posts/{guid}{ext}`. Text content trimmed and length-checked.
- `DELETE {id}` — owner-only, returns 403 otherwise.
- `GET {id}` — single post + comments (newest first) + counts + `isLiked`.
- `POST {id}/like` — toggles a like, returns new `liked` flag and `likeCount`.
- `POST {id}/comments` — adds a comment, returns the comment with user info.
- `GET {id}/comments` — list comments for a post (newest first).

### 2.7 Middleware ([Backend/Middlewares/GlobalExceptionMiddleware.cs](Backend/Middlewares/GlobalExceptionMiddleware.cs))

Wraps the pipeline, logs unhandled exceptions, and returns a JSON `500` with `{ success, message, details }`. The exception message is currently exposed in `details` — fine for dev, but should be suppressed in production.

---

## 3. Frontend (React 19 + Vite)

### 3.1 Tooling ([Frontend/package.json](Frontend/package.json))

- **Runtime:** `react@19.2`, `react-dom@19.2`, `react-router-dom@7.13`.
- **Networking:** `axios@1.13`.
- **Image cropping:** `react-easy-crop@5.5`.
- **Icons:** `react-icons@5.5` (Feather + Font Awesome).
- **Dev/build:** Vite (via `rolldown-vite@7.2.5` override) + `@vitejs/plugin-react`, ESLint 9 with React hooks/refresh plugins.

### 3.2 Entry ([Frontend/src/main.jsx](Frontend/src/main.jsx))

- Mounts `<App>` wrapped in `<BrowserRouter>` and `<AuthProvider>`.
- Installs a **global axios response interceptor**: any `401` clears `token` from localStorage and redirects to `/login`.

### 3.3 Routing ([Frontend/src/App.jsx](Frontend/src/App.jsx))

Public:
- `/` Home, `/login`, `/register`, `/setup-profile`
- Footer pages: `/faq`, `/guidelines`, `/privacy`, `/terms`, `/contact`

Protected (wrapped in `<ProtectedRoute>` → `<FeedLayout>`):
- `/feed`, `/explore`, `/search`, `/create-post`, `/profile`, `/profile/:username`, `/settings`

Misc: `/dashboard` → redirect to `/feed`; `*` → `NotFound`.

Wrapped in `<ToastProvider>` with a global `<ToastContainer>`, `<Navbar>` and `<Footer>` rendered around the route outlet, plus `<ScrollToTopButton>`.

### 3.4 Contexts

- **[AuthContext](Frontend/src/context/AuthContext.jsx)** — on mount, reads `token` from localStorage and fetches `/api/users/me`; exposes `{ user, setUser, logout, loading }`. `logout()` clears the token and user.
- **[ToastContext](Frontend/src/context/ToastContext.jsx)** — `addToast(message, type)` adds a 4 s auto-dismissed toast; the `<ToastContainer>` renders the live list with per-toast progress bars ([Toast.jsx](Frontend/src/components/Toast/Toast.jsx)).

### 3.5 Layout components

- **[Navbar.jsx](Frontend/src/components/Navbar.jsx)** — logo + Home/Feed links + profile avatar when authenticated, otherwise Login/Register.
- **[Sidebar.jsx](Frontend/src/components/Sidebar.jsx)** — vertical nav for `/feed`, `/explore`, `/search`, `/create-post`, `/profile`, `/settings`. Rendered inside `<FeedLayout>` via `<Outlet>`.
- **[Footer.jsx](Frontend/src/components/footer/Footer.jsx)** — logo + social icons (Twitter/Instagram/Discord/Spotify inline SVGs) + legal nav.
- **[ProtectedRoute.jsx](Frontend/src/components/ProtectedRoute.jsx)** — waits for `loading`, then redirects to `/login` if `user` is missing.
- **[ScrollToTopButton.jsx](Frontend/src/components/ScrollToTopButton.jsx)** — appears after 300 px scroll.
- **[Loader.jsx](Frontend/src/components/Loader.jsx)** — five-span animated loading indicator.

### 3.6 Pages

#### Home ([Home.jsx](Frontend/src/pages/Home.jsx))
Marketing landing page with hero ("Find Your Groove") and a "What Makes Us Different" timeline section. Uses the **[useScrollReveal](Frontend/src/hooks/useScrollReveal.js)** hook (IntersectionObserver toggling a `visible` class) for staged animations.

#### Authorization
- **[Login.jsx](Frontend/src/pages/authorization/Login.jsx)** — email/password form, toggleable password visibility, posts to `/api/auth/login`, stores token, calls `setUser`, navigates to `/feed`. Errors surface as toasts.
- **[Register.jsx](Frontend/src/pages/authorization/Register.jsx)** — client-side validation mirrors the backend regexes, password strength meter (0–5) with live colored bar, requirement popup with check/cross indicators, async `/api/auth/check-username` and `/api/auth/check-email` on blur, auto-login then navigate to `/setup-profile`.
- **[SetupProfile.jsx](Frontend/src/pages/authorization/SetupProfile.jsx)** — DOB, gender, bio, and profile photo with **react-easy-crop** modal (1:1 aspect, zoom slider, live preview). Submits as multipart `PUT /api/users/me`.

#### Feed area (`<FeedLayout>`)
- **[Feed.jsx](Frontend/src/pages/feed/Feed.jsx)** — paginated feed of followed users, infinite scroll via `IntersectionObserver` on the last post node, optimistic like updates, expandable comment threads with inline input, `timeAgo()` formatter.
- **[Explore.jsx](Frontend/src/pages/feed/Explore.jsx)** — horizontal "Suggested Accounts" carousel (`scrollBy` arrow buttons) + paginated recent posts from everyone. Same like/comment UX as Feed. Follow/unfollow inline.
- **[Profile.jsx](Frontend/src/pages/feed/Profile.jsx)** — `/profile` shows the current user, `/profile/:username` shows another user. Avatar, name, handle, bio, follower/following/posts counts, follow/unfollow button on others, grid of posts (text/image/video) with like+comment counts, share-link copy (clipboard), and delete on own posts. Scrolls to `#post-<id>` if the URL contains a hash.
- **[Search.jsx](Frontend/src/pages/feed/Search.jsx)** — query form against `/api/users/search`; result cards with avatar, name, follow toggle.
- **[CreatePost.jsx](Frontend/src/pages/feed/CreatePost.jsx)** — tabs for `text` or `media`. 256-char counter, file size check (15 MB), image/video preview, multipart POST to `/api/posts`.
- **[Settings.jsx](Frontend/src/pages/feed/Settings.jsx)** — edit first/last name, bio, gender, DOB, and profile picture (with the same crop modal). Username and email are read-only. Multipart `PUT /api/users/me`, toast on success, log-out button at the bottom.

#### Footer pages
Static informational pages in [Frontend/src/components/footer/pages/](Frontend/src/components/footer/pages/): `FAQ.jsx`, `CommunityGuidelines.jsx`, `PrivacyPolicy.jsx`, `TermsOfService.jsx`, `Contact.jsx`. All share `footer-pages.css`.

#### 404 ([NotFound.jsx](Frontend/src/pages/NotFound.jsx))
Friendly "lost its groove" page with a link back to `/`.

### 3.7 Utility ([cropImage.js](Frontend/src/utils/cropImage.js))
Canvas-based helper that takes a cropped-area-pixels rect from `react-easy-crop` and returns a JPEG `Blob` suitable for `FormData` upload.

---

## 4. End-to-end Data Flow (typical request)

1. User loads the React app → `AuthProvider` checks localStorage for `token`, calls `GET /api/users/me`.
2. ASP.NET JWT middleware validates the bearer token; if valid, `User.FindFirstValue(NameIdentifier)` yields the user id used by controllers.
3. Controller queries EF Core, projects a tailored anonymous object (avoiding navigation cycles), returns JSON.
4. React updates state; optimistic UI for likes/follows; toasts notify of errors.
5. Media uploads use `multipart/form-data`; the API writes files to `Frontend/src/assets/Images/{posts|profilePictures}/<guid>.<ext>` and records the relative URL on the entity. The frontend dev server serves these as static assets.

---

## 5. Notable Conventions & Design Choices

- **Username/email normalization:** trimmed + lowercased before lookup and persistence.
- **Cascade deletes** wired in EF model — deleting a user removes their posts, comments, likes, follows.
- **Pagination** is page/size with a `hasMore` flag; client uses an `IntersectionObserver` on the last card.
- **DTO/anonymous projection separation** — controllers return inline anonymous objects rather than reusing the entity types.
- **CORS is permissive only for `localhost:5173/5174`** — easy local dev, requires update for deployment.
- **Static-file serving** is enabled (`app.UseStaticFiles()`) but uploads currently land in the frontend `src/assets` tree, served by Vite, not by the API itself.

---

## 6. Security Notes (worth tightening)

- `appsettings.json` contains the **PostgreSQL password and JWT signing key in plaintext** and is committed. Move to user-secrets / environment variables / a vault before any deployment.
- JWT validation **does not check issuer or audience** — fine for a single-host demo, but should be enabled with configured values for production.
- `GlobalExceptionMiddleware` leaks `exception.Message` in responses. Suppress `details` outside development.
- Tokens live in `localStorage` (XSS-exposed); consider HttpOnly cookies for stronger storage in production.
- No rate limiting on auth or like/comment endpoints.
- Username on `PUT /api/users/me` is changeable; the Settings UI disables it but the API still accepts it.

---

## 7. Running Locally

**Backend** (.NET 10 SDK + PostgreSQL):
```powershell
cd Backend
dotnet ef database update   # apply migrations
dotnet run                  # listens on http://localhost:5290 by default
```

**Frontend** (Node 20+ recommended):
```powershell
cd Frontend
npm install
npm run dev                 # Vite dev server on http://localhost:5173
```

Optionally set `VITE_API_URL` to override the default `http://localhost:5290` API base used across the app.

---

## 8. Quick API Reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/auth/check-username?username=` | no  | Username availability |
| GET  | `/api/auth/check-email?email=`       | no  | Email availability |
| POST | `/api/auth/register`                 | no  | Register + auto-login (JWT) |
| POST | `/api/auth/login`                    | no  | Login (JWT) |
| GET  | `/api/users/search?q=&excludeSelf=`  | yes | Search users |
| POST | `/api/users/{id}/follow`             | yes | Toggle follow |
| GET  | `/api/users/me`                      | yes | Current user + posts/counts |
| PUT  | `/api/users/me`                      | yes | Update profile (multipart) |
| GET  | `/api/users/{username}`              | yes | Public profile |
| GET  | `/api/posts/feed?page=&size=`        | yes | Followed-user feed |
| GET  | `/api/posts/explore?page=&size=`     | yes | Global recent feed |
| POST | `/api/posts`                         | yes | Create post (multipart) |
| DELETE | `/api/posts/{id}`                  | yes | Owner-only delete |
| GET  | `/api/posts/{id}`                    | yes | Post + comments |
| POST | `/api/posts/{id}/like`               | yes | Toggle like |
| POST | `/api/posts/{id}/comments`           | yes | Add comment |
| GET  | `/api/posts/{id}/comments`           | yes | List comments |
