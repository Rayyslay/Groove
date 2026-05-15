# Groove Network - Frontend

This is the frontend client for the Groove Network, built with React and Vite.

## Authentication Flow

Our application implements a robust JWT-based authentication architecture:

1. **User Login/Registration:**
   - The user submits their email and password through the `/login` or `/register` route.
   - The backend validates the credentials (using bcrypt hashing) against the PostgreSQL database.
   - On success, the backend generates and returns a cryptographically signed JSON Web Token (JWT) with an expiry (e.g., 7 days) and basic user claims payload.

2. **Token Storage:**
   - The React frontend receives the JWT from the login response and stores it securely in `localStorage` under the key `"token"`.
   - Any React Context (`AuthContext.jsx`) observing authentication status will fetch this token to keep session state.

3. **Global Interceptors:**
   - Axios is configured with a global interceptor in `main.jsx` to catch `401 Unauthorized` responses.
   - If an API token expires or is rejected by the ASP.NET Core backend, the interceptor automatically scrubs the invalid token from storage and gracefully redirects the user to the `/login` page to re-authenticate.

4. **Security & Data:**
   - Client endpoints attach the Token inside the `Authorization: Bearer <token>` header for all protected API route actions.
   - Using this flow ensures stateless, server-side verified sessions that easily scale.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
