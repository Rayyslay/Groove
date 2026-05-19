# Groove — Codebase Overview

A full-stack social media web app called **Groove**, built as an ASP.NET Core Web API (.NET 10) backend with a React 19 + Vite frontend, talking to a PostgreSQL database via Entity Framework Core. JWT-based auth with rotating refresh tokens, multipart media uploads to Supabase Storage, and a feed/explore/profile/follow/like/comment loop.

**Live deployment:** Frontend on **Vercel**, backend Docker image on **Render**, database + object storage on **Supabase** (single project for both).

---

## 1. Repository Layout

```
Groove/
├── Backend/                  # ASP.NET Core Web API (.NET 10)
│   ├── Controllers/          # Auth, Users, Posts
│   ├── Data/                 # AppDbContext (EF Core)
│   ├── DTOs/                 # Request validation DTOs
│   ├── Middlewares/          # Global exception handler
│   ├── Migrations/           # EF Core migrations
│   ├── Models/               # User, Post, Comment, Like, Follow, RefreshToken
│   ├── Services/             # SupabaseStorageService
│   ├── Program.cs            # Startup, DI, JWT, env-driven CORS
│   ├── appsettings.json      # Local-only (gitignored); production reads env vars
│   ├── Dockerfile            # Multi-stage .NET 10 SDK → aspnet runtime
│   ├── .dockerignore
│   └── Backend.csproj
└── Frontend/                 # React 19 SPA (Vite)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── vercel.json           # SPA rewrite — every path → index.html
    ├── public/
    │   └── assets/           # Static UI images (logo, default avatar, etc.)
    └── src/
        ├── App.jsx           # Top-level routes
        ├── main.jsx          # React root + refresh-aware axios interceptor
        ├── context/          # AuthContext (token + refresh), ToastContext
        ├── components/       # Navbar, Sidebar, Footer, Toast, Loader, ProtectedRoute, ScrollToTopButton
        ├── pages/
        │   ├── Home.jsx, NotFound.jsx, FeedLayout.jsx
        │   ├── authorization/  # Login, Register, SetupProfile
        │   └── feed/           # Feed, Explore, Profile, Search, Settings, CreatePost
        ├── hooks/            # useScrollReveal
        ├── utils/            # cropImage (canvas helper)
        └── assets/           # (Vite-imported assets if any)
```

---

## 2. Backend (ASP.NET Core, .NET 10)

### 2.1 Configuration

All sensitive values come from **environment variables** in production (set in Render's dashboard) and ASP.NET Core's `IConfiguration` merges them automatically with `appsettings.json`. The `__` separator in env var names maps to `:` in config keys (e.g., `ConnectionStrings__DefaultConnection` → `ConnectionStrings:DefaultConnection`).

`Backend/appsettings.json` is **gitignored** — it exists only locally for development and contains the same config keys with local values (localhost Postgres connection, local JWT key, empty Supabase fields).

Required configuration keys:
- `ConnectionStrings:DefaultConnection` — Npgsql key-value format. Local: `Host=localhost;Port=5432;...`. Production: Supabase session-pooler key-value string with `SSL Mode=Require;Trust Server Certificate=true;Keepalive=15;No Reset On Close=true`.
- `JwtSettings:JWTkey` — HMAC-SHA256 signing key (32+ random bytes).
- `Cors:AllowedOrigins` — comma-separated origin list, e.g. `https://groove-flax.vercel.app,http://localhost:5173`.
- `Supabase:Url` — `https://<project-ref>.supabase.co`.
- `Supabase:ServiceRoleKey` — server-only key for Storage uploads. Never sent to the frontend.
- `Supabase:Bucket` — bucket name (default `media`).

### 2.2 Startup ([Backend/Program.cs](Backend/Program.cs))

- `AddControllers()`, Swagger (dev only).
- **CORS:** policy `AllowFrontend` reads `Cors:AllowedOrigins` and splits on comma. No origins hardcoded.
- **DbContext:** `AppDbContext` registered with `UseNpgsql`.
- **SupabaseStorageService:** registered via `AddHttpClient<SupabaseStorageService>()` — typed HttpClient with the service role key set in the constructor as a default `Bearer` header.
- **JWT bearer auth:** `ValidateIssuer = false`, `ValidateAudience = false`, `ValidateLifetime = true`, signing key validated. Access tokens expire in **15 minutes** (refresh tokens cover longer sessions).
- Middleware order: `GlobalExceptionMiddleware` → HTTPS redirect → CORS → `Authentication` → `Authorization` → controllers. (`UseStaticFiles` was removed — uploads no longer hit the filesystem.)
- Throws on missing JWT key at startup.

### 2.3 Data Model

**[Models/User.cs](Backend/Models/User.cs)** — `Id`, `Username`, `Email`, `PasswordHash`, `FirstName`, `LastName`, `ProfilePictureUrl?`, `Bio?`, `Gender?`, `DateOfBirth?`, `CreatedAt`, `UpdatedAt`, `LastLogin?`, `IsActive`, `IsDeleted`.

**[Models/Post.cs](Backend/Models/Post.cs)** — `Id`, `UserId`, `TextContent?`, `MediaUrl?` (Supabase public CDN URL), `MediaType?` (`image`/`video`), `PostType` (`text`/`media`), `CreatedAt`, navigations to `Comments` and `Likes`.

**[Models/Comment.cs](Backend/Models/Comment.cs)** — `Id`, `PostId`, `UserId`, `Content`, `CreatedAt`.

**[Models/Like.cs](Backend/Models/Like.cs)** — `Id`, `PostId`, `UserId`, `CreatedAt`. Unique index on `(PostId, UserId)`.

**[Models/Follow.cs](Backend/Models/Follow.cs)** — `Id`, `FollowerId`, `FollowingId`, `CreatedAt`. Unique index on the pair.

**[Models/RefreshToken.cs](Backend/Models/RefreshToken.cs)** — `Id`, `Token` (unique, 128 chars max), `UserId`, `ExpiresAt`, `CreatedAt`, `RevokedAt?`. Cascade-deletes with the user. Each refresh creates a new row and revokes the old; revoked/expired rows are kept for audit but rejected by `/auth/refresh`.

### 2.4 DbContext ([Backend/Data/AppDbContext.cs](Backend/Data/AppDbContext.cs))

- Unique indexes on `User.Email`, `User.Username`, `RefreshToken.Token`, `Like.(PostId, UserId)`, `Follow.(FollowerId, FollowingId)`.
- Default values for `IsActive`, `IsDeleted`, `CreatedAt`, `UpdatedAt`, `PostType="text"` via `HasDefaultValue` / `HasDefaultValueSql("NOW()")`.
- Cascade deletes from `Post → User`, `Comment → Post/User`, `Like → Post/User`, `Follow → User`, `RefreshToken → User`.
- Length constraints (e.g., `Bio` 150, `TextContent` 256, `Comment.Content` 500, `MediaUrl` 500, `RefreshToken.Token` 128).

Migrations (in order): `InitialCreate`, `UpdateBioLength`, `AddPostsCommentsLikesFollows`, `AddGenderAndDateOfBirth`, `AddRefreshTokens`.

> **Note on running migrations against Supabase from Windows:** the direct connection (port 5432, hostname `db.<ref>.supabase.co`) resolves to an IPv6 address that Windows often blocks. As a workaround, generate the migration locally (`dotnet ef migrations add ...`), then convert the `Up()` method to SQL and run it in the Supabase SQL editor (`https://supabase.com/dashboard/project/<ref>/sql/new`). Remember to insert a row into `__EFMigrationsHistory` so EF knows the migration has been applied.

### 2.5 DTOs

- **[RegisterDto](Backend/DTOs/RegisterDto.cs)** — strict validators: username regex `^[A-Za-z0-9._-]+$` (4–50), email + max 100, password 8+ with upper/lower/digit/special, `ConfirmPassword` matches, names letters-only.
- **[LoginDto](Backend/DTOs/LoginDto.cs)** — email + password.
- **[CreatePostDto](Backend/DTOs/CreatePostDto.cs)** — `PostType` regex `^(text|media)$`, `TextContent` ≤ 256 (file handled directly as `IFormFile`).
- **[CreateCommentDto](Backend/DTOs/CreateCommentDto.cs)** — `Content` required, ≤ 500.

### 2.6 Controllers

#### [AuthController](Backend/Controllers/AuthController.cs) — `api/auth`
- `GET check-username?username=` / `GET check-email?email=` — async existence check (case-insensitive).
- `POST register` — validates DTO, ensures uniqueness, hashes password with `PasswordHasher<User>`, **auto-logs in** and returns `{ token, refreshToken, user }`.
- `POST login` — verifies hashed password, returns `{ token, refreshToken, user }`. Logs warnings on failure, info on success.
- `POST refresh` — body `{ refreshToken }`. Looks up the token, verifies it's not revoked or expired, **rotates** (revokes old, issues new), returns `{ token, refreshToken }`. Rotation means a leaked refresh token only works once before becoming invalid.
- `POST logout` `[Authorize]` — body `{ refreshToken }`. Marks the matching row as revoked. Idempotent.

Internal helpers:
- `GenerateAccessToken(user)` — 15-minute JWT with `NameIdentifier`, `Name`, `Email` claims, HMAC-SHA256.
- `IssueRefreshTokenAsync(userId)` — 64 random bytes → base64 → new `RefreshTokens` row with 30-day expiry.

#### [UsersController](Backend/Controllers/UsersController.cs) — `api/users` (all `[Authorize]` except `count`)
- `GET count` `[AllowAnonymous]` — returns `{ count }` of non-deleted users. Cached in-process via `IMemoryCache` for 5 minutes (key `users:active-count`) so the marketing landing page never triggers a `COUNT(*)` per visitor. Cache is invalidated on `POST /api/auth/register` so the number ticks up promptly.
- `GET search?q=&excludeSelf=` — case-insensitive `Contains` on username / first / last name, capped at 20 results, returns `isFollowing` per result.
- `POST {id}/follow` — toggles a Follow row; rejects self-follow.
- `GET me` — returns current user + counts (posts, followers, following) + post list (newest-first).
- `PUT me` (multipart) — updates first/last name, bio, gender (whitelisted: Male/Female/Other/PreferNotToSay), date of birth (UTC), username (with uniqueness check), and optional profile picture upload (≤ 5 MB, jpg/jpeg/png/gif/webp). **Uploads go to Supabase Storage** at `media/profile-pictures/{guid}{ext}`; the returned public CDN URL is stored on `User.ProfilePictureUrl`.
- `GET {username}` — public profile lookup with the same counts + `isFollowing` for the caller and posts including each post's `isLiked` state.

#### [PostsController](Backend/Controllers/PostsController.cs) — `api/posts` (all `[Authorize]`)
- `GET feed?page=&size=` — posts from people the user follows, descending by `CreatedAt`, paginated. Returns `hasMore`.
- `GET explore?page=&size=` — newest posts globally, paginated.
- `POST` (multipart) — creates text or media post. Media ≤ 15 MB; images jpg/jpeg/png/gif/webp; videos mp4/webm/mov. **Media uploads go to Supabase Storage** at `media/posts/{guid}{ext}`; the returned public CDN URL is stored on `Post.MediaUrl`.
- `DELETE {id}` — owner-only, returns 403 otherwise.
- `GET {id}` — single post + comments (newest first) + counts + `isLiked`.
- `POST {id}/like` — toggles a like, returns new `liked` flag and `likeCount`.
- `POST {id}/comments` — adds a comment, returns the comment with user info.
- `GET {id}/comments` — list comments for a post (newest first).

### 2.7 Middleware ([Backend/Middlewares/GlobalExceptionMiddleware.cs](Backend/Middlewares/GlobalExceptionMiddleware.cs))

Wraps the pipeline, logs unhandled exceptions, returns a JSON `500` with `{ success, message, details }`. `details` includes the exception message — handy during development, **should be suppressed outside Development**.

### 2.8 Services

**[SupabaseStorageService](Backend/Services/SupabaseStorageService.cs)** — thin HttpClient wrapper around Supabase's Storage REST API. `UploadAsync(stream, path, contentType)` POSTs the file to `{SUPABASE_URL}/storage/v1/object/{bucket}/{path}` with `Authorization: Bearer {service_role_key}`. On failure, the response body is included in the exception message so errors like `{"error":"Bucket not found"}` propagate up to the client via the global middleware. Returns the public CDN URL `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`. Registered as a typed HttpClient via `AddHttpClient<SupabaseStorageService>()`.

---

## 3. Frontend (React 19 + Vite)

### 3.1 Tooling ([Frontend/package.json](Frontend/package.json))

- **Runtime:** `react@19.2`, `react-dom@19.2`, `react-router-dom@7.13`.
- **Networking:** `axios@1.13`.
- **Image cropping:** `react-easy-crop@5.5`.
- **Icons:** `react-icons@5.5` (Feather + Font Awesome).
- **Dev/build:** Vite (via `rolldown-vite@7.2.5` override) + `@vitejs/plugin-react`, ESLint 9 with React hooks/refresh plugins.
- **`Frontend/vercel.json`** — single rewrite rule sending every path to `/index.html` so React Router handles all client-side routes (without this, deep links and page refreshes 404 on Vercel).

### 3.2 Entry ([Frontend/src/main.jsx](Frontend/src/main.jsx))

- Mounts `<App>` wrapped in `<BrowserRouter>` and `<AuthProvider>`.
- Installs a **refresh-aware axios interceptor**: on any 401 (except a refresh call itself), reads `refreshToken` from localStorage, calls `POST /api/auth/refresh`, stores the new tokens, and retries the original request transparently. A module-level `refreshing` promise dedupes concurrent 401s so N simultaneous failures trigger only one refresh call. If refresh fails or no refresh token exists, both tokens are cleared and the user is redirected to `/login`.

### 3.3 Routing ([Frontend/src/App.jsx](Frontend/src/App.jsx))

Public:
- `/` Home, `/login`, `/register`, `/setup-profile`
- Footer pages: `/faq`, `/guidelines`, `/privacy`, `/terms`, `/contact`

Protected (wrapped in `<ProtectedRoute>` → `<FeedLayout>`):
- `/feed`, `/explore`, `/search`, `/create-post`, `/profile`, `/profile/:username`, `/settings`

Misc: `/dashboard` → redirect to `/feed`; `*` → `NotFound`.

Wrapped in `<ToastProvider>` with a global `<ToastContainer>`, `<Navbar>` and `<Footer>` rendered around the route outlet, plus `<ScrollToTopButton>`.

### 3.4 Contexts

- **[AuthContext](Frontend/src/context/AuthContext.jsx)** — on mount, reads `token` from localStorage and fetches `/api/users/me`; exposes `{ user, setUser, logout, loading }`. `logout()` is async: it calls `POST /api/auth/logout` with the stored refresh token (server marks it revoked), then clears both localStorage keys. If the server call fails (e.g., token already expired), client cleanup still happens.
- **[ToastContext](Frontend/src/context/ToastContext.jsx)** — `addToast(message, type)` adds a 4 s auto-dismissed toast; the `<ToastContainer>` renders the live list with per-toast progress bars ([Toast.jsx](Frontend/src/components/Toast/Toast.jsx)).

### 3.5 Layout & shared components

- **[Navbar.jsx](Frontend/src/components/Navbar.jsx)** — logo + Home/Feed links + profile avatar when authenticated, otherwise Login/Register. Static images referenced from `/assets/` (served by Vercel from `Frontend/public/assets/`).
- **[Sidebar.jsx](Frontend/src/components/Sidebar.jsx)** — vertical nav for `/feed`, `/explore`, `/search`, `/create-post`, `/profile`, `/settings`. Rendered inside `<FeedLayout>` via `<Outlet>`.
- **[Footer.jsx](Frontend/src/components/footer/Footer.jsx)** — logo + social icons (Twitter/Instagram/Discord/Spotify inline SVGs) + legal nav.
- **[ProtectedRoute.jsx](Frontend/src/components/ProtectedRoute.jsx)** — waits for `loading`, then redirects to `/login` if `user` is missing.
- **[ScrollToTopButton.jsx](Frontend/src/components/ScrollToTopButton.jsx)** — appears after 300 px scroll.
- **[Loader.jsx](Frontend/src/components/Loader.jsx)** — five-span animated loading indicator.
- **[VideoPlayer.jsx](Frontend/src/components/VideoPlayer.jsx)** — custom video player with play/pause, mute, scrub bar, and centered play indicator. Used for post videos.
- **[PostModal.jsx](Frontend/src/components/PostModal.jsx)** — full-screen overlay that shows a single post: media on the left at proper aspect ratio, header + body + actions + comment thread + input on the right (stacked on mobile). Opened by clicking a post's media, text body, or comment count from Feed / Explore / Profile. Handles its own like-toggle, comment posting, share-link copy (to `/profile/{username}#post-{id}`), and optional delete callback (owner-only). Calls `onUpdate(post)` so the underlying list re-syncs like/comment counts after the modal closes. Esc to close, locks body scroll while open. The `DeleteConfirmModal` in Profile uses z-index 1100 so it stacks above the PostModal's 1000 when delete is triggered from inside the modal.

### 3.6 Pages

#### Home ([Home.jsx](Frontend/src/pages/Home.jsx))
Marketing landing page with hero ("Find Your Groove"), a "What Makes Us Different" timeline section, and a bottom **"Are you ready to join N users?"** CTA. Uses the **[useScrollReveal](Frontend/src/hooks/useScrollReveal.js)** hook (IntersectionObserver toggling a `visible` class) for staged animations. The CTA section runs its own IntersectionObserver: when it scrolls into view it fades up and an ease-out-cubic counter animates from 0 to the real user count (fetched once on mount from the public, server-cached `GET /api/users/count`). The number uses the same purple gradient as the "Groove" word in the hero.

#### Authorization
- **[Login.jsx](Frontend/src/pages/authorization/Login.jsx)** — email/password form, toggleable password visibility, posts to `/api/auth/login`, stores **both** `token` and `refreshToken` in localStorage, calls `setUser`, navigates to `/feed`. Errors surface as toasts.
- **[Register.jsx](Frontend/src/pages/authorization/Register.jsx)** — client-side validation mirrors the backend regexes, password strength meter (0–5) with live colored bar, requirement popup with check/cross indicators, async `/api/auth/check-username` and `/api/auth/check-email` on blur, auto-login (stores both tokens), then navigate to `/setup-profile`.
- **[SetupProfile.jsx](Frontend/src/pages/authorization/SetupProfile.jsx)** — DOB, gender, bio, and profile photo with **react-easy-crop** modal (1:1 aspect, zoom slider, live preview). Submits as multipart `PUT /api/users/me` — the backend uploads to Supabase Storage.

#### Feed area (`<FeedLayout>`)
- **[Feed.jsx](Frontend/src/pages/feed/Feed.jsx)** — paginated feed of followed users, infinite scroll via `IntersectionObserver` on the last post node, optimistic like updates with filled-heart icon (`FaHeart`) when liked vs hollow (`FiHeart`) when not. Clicking the post image or the comment button opens the shared `<PostModal>` instead of expanding comments inline.
- **[Explore.jsx](Frontend/src/pages/feed/Explore.jsx)** — horizontal "Suggested Accounts" carousel (`scrollBy` arrow buttons) + paginated recent posts from everyone. Same like/comment + `<PostModal>` UX as Feed. Follow/unfollow inline.
- **[Profile.jsx](Frontend/src/pages/feed/Profile.jsx)** — `/profile` shows the current user, `/profile/:username` shows another user. Avatar, name, handle, bio, follower/following/posts counts, follow/unfollow button on others, grid of posts (text/image/video) with like+comment counts, share-link copy (clipboard), and delete on own posts (with confirmation `DeleteConfirmModal`). Clicking a post's media or comment count opens the shared `<PostModal>`. Scrolls to `#post-<id>` if the URL contains a hash.
- **[Search.jsx](Frontend/src/pages/feed/Search.jsx)** — query form against `/api/users/search`; result cards with avatar, name, follow toggle.
- **[CreatePost.jsx](Frontend/src/pages/feed/CreatePost.jsx)** — tabs for `text` or `media`. 256-char counter, file size check (10 MB — matches the Supabase bucket per-file cap), image/video preview, multipart POST to `/api/posts`. Backend uploads to Supabase Storage; on failure, the toast and console show the actual server error.
- **[Settings.jsx](Frontend/src/pages/feed/Settings.jsx)** — edit first/last name, bio, gender, DOB, and profile picture (with the same crop modal). Username and email are read-only. Multipart `PUT /api/users/me`, toast on success or actual server error message on failure, log-out button at the bottom (calls `AuthContext.logout()` which revokes the refresh token).

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
5. Media uploads use `multipart/form-data` → controller streams the `IFormFile` directly into `SupabaseStorageService.UploadAsync()` → Supabase returns the public CDN URL → URL is persisted on the entity (`Post.MediaUrl` or `User.ProfilePictureUrl`) → frontend renders the image directly from Supabase's CDN.
6. When the 15-minute access token expires, the next API call returns 401. The axios interceptor in `main.jsx` catches it, calls `/api/auth/refresh` with the stored refresh token, swaps in the new tokens, and retries the original request — invisible to the user.

---

## 5. Notable Conventions & Design Choices

- **Username/email normalization:** trimmed + lowercased before lookup and persistence.
- **Cascade deletes** wired in EF model — deleting a user removes their posts, comments, likes, follows, and refresh tokens.
- **Pagination** is page/size with a `hasMore` flag; client uses an `IntersectionObserver` on the last card.
- **DTO/anonymous projection separation** — controllers return inline anonymous objects rather than reusing the entity types.
- **Env-driven config** — all secrets and environment-specific values (DB connection, CORS, JWT key, Supabase) come from env vars, not committed files.
- **Refresh token rotation** — every successful refresh revokes the old token and issues a new one; the `RefreshTokens` row stays for audit.
- **Storage URL contract** — `Post.MediaUrl` and `User.ProfilePictureUrl` always store the absolute Supabase public CDN URL. The frontend renders `<img src={url}>` directly with no path rewriting.
- **Static images** — UI assets (logo, default avatar) live in `Frontend/public/assets/` and are referenced via `/assets/...` paths so they survive the production build. Logo and decorative images use `.webp` format (~70-90% smaller than the original PNGs). User uploads go to Supabase Storage, never the local filesystem.
- **Vercel SPA routing** — `Frontend/vercel.json` rewrites every path to `/index.html` so deep links and refreshes work.
- **Shared `<PostModal>` for post detail view** — Feed, Explore, and Profile all open the same modal when a user clicks a post's media or comment count. The parent owns the post list state and passes an `onUpdate` callback so any like/comment changes inside the modal flow back to the list. Profile additionally passes `onDelete` so the existing `DeleteConfirmModal` is reused.

---

## 6. Security Notes

- **Secrets are externalized** — `appsettings.json` is gitignored; production reads env vars from Render. JWT key, DB password, and Supabase service role key never appear in the repo.
- **JWT validation does not check issuer or audience** — fine for a single-host deployment, but could be enabled with configured values for higher assurance.
- **`GlobalExceptionMiddleware` leaks `exception.Message`** in 500 responses. Useful while debugging; should be suppressed outside Development environment.
- **Tokens live in `localStorage`** (XSS-exposed). Refresh-token rotation limits damage from a stolen access token (15 min lifetime), but a stolen refresh token gives 30 days of access until the user logs out. HttpOnly-cookie storage would be stronger but adds CORS/cookie complexity.
- **No rate limiting** on auth or like/comment endpoints.
- **Username on `PUT /api/users/me` is changeable**; the Settings UI disables it but the API still accepts it.
- **Refresh token revocation is per-token, not per-family** — if a revoked token is presented we reject only that token. Production systems often revoke the entire user's token family on revoked-token reuse (token theft signal). Deferred.

---

## 7. Running Locally

**Local-only setup files:**
- `Backend/appsettings.json` (gitignored) — create with your local Postgres connection, a JWT key, and either empty Supabase fields (uploads will fail with a clear error) or your real Supabase credentials if you want to test uploads.
- `Frontend/.env.local` (gitignored, optional) — `VITE_API_URL=http://localhost:5290` (this is also the fallback, so the file is optional).

**Backend** (.NET 10 SDK + PostgreSQL):
```powershell
cd Backend
dotnet ef database update   # apply migrations to local Postgres
dotnet run                  # listens on http://localhost:5290
```

**Frontend** (Node 20+ recommended):
```powershell
cd Frontend
npm install
npm run dev                 # Vite dev server on http://localhost:5173
```

---

## 8. Quick API Reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/users/count`                   | no  | Total non-deleted user count (5-min in-memory cache) |
| GET  | `/api/auth/check-username?username=` | no  | Username availability |
| GET  | `/api/auth/check-email?email=`       | no  | Email availability |
| POST | `/api/auth/register`                 | no  | Register + auto-login (returns access + refresh) |
| POST | `/api/auth/login`                    | no  | Login (returns access + refresh) |
| POST | `/api/auth/refresh`                  | no  | Exchange a refresh token for new access + refresh (rotation) |
| POST | `/api/auth/logout`                   | yes | Revoke a refresh token |
| GET  | `/api/users/search?q=&excludeSelf=`  | yes | Search users |
| POST | `/api/users/{id}/follow`             | yes | Toggle follow |
| GET  | `/api/users/me`                      | yes | Current user + posts/counts |
| PUT  | `/api/users/me`                      | yes | Update profile (multipart, profile pic → Supabase Storage) |
| GET  | `/api/users/{username}`              | yes | Public profile |
| GET  | `/api/posts/feed?page=&size=`        | yes | Followed-user feed |
| GET  | `/api/posts/explore?page=&size=`     | yes | Global recent feed |
| POST | `/api/posts`                         | yes | Create post (multipart, media → Supabase Storage) |
| DELETE | `/api/posts/{id}`                  | yes | Owner-only delete |
| GET  | `/api/posts/{id}`                    | yes | Post + comments |
| POST | `/api/posts/{id}/like`               | yes | Toggle like |
| POST | `/api/posts/{id}/comments`           | yes | Add comment |
| GET  | `/api/posts/{id}/comments`           | yes | List comments |

---

## 9. Deployment

- **Frontend** — Vercel (`groove-flax.vercel.app`), auto-deploys on push to `main`. Root: `Frontend/`. Build: `npm run build`, output: `dist/`. One env var: `VITE_API_URL`.
- **Backend** — Render (`asp-net-tlxe.onrender.com`), Docker deployment from `Backend/Dockerfile`. Auto-deploys on push to `main`. Env vars: `ConnectionStrings__DefaultConnection`, `JwtSettings__JWTkey`, `Cors__AllowedOrigins`, `Supabase__Url`, `Supabase__ServiceRoleKey`, `Supabase__Bucket`, `ASPNETCORE_ENVIRONMENT=Production`.
- **Database + Storage** — Supabase. PostgreSQL via session pooler (`aws-1-ap-northeast-1.pooler.supabase.com:5432`). Object storage in the public `media` bucket. Free-tier project pauses after 7 days idle.

Both Render and Supabase free tiers have cold-start / pause behaviors — the first request after idle may take 30–60 seconds.
