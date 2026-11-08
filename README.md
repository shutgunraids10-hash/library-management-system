# SmartLib

SmartLib is a live library management app with student, librarian, and administrator workspaces, role-aware sign-in, and MongoDB persistence for books, loans, reservations, accounts, and library settings. The production app requires MongoDB and does not fall back to sample data.

## Run locally

Install the dependencies and start Vercel's local development server:

```sh
npm install
npm run dev
```

Set the environment values below in `.env.local` before starting the app. Sign-in requires a real MongoDB account.

## Connect MongoDB

1. The connected production database is in MongoDB Atlas. Keep its URI in Vercel as the server-only `MONGODB_URI`; set `MONGODB_DB` only if needed. `SESSION_SECRET` must be at least 32 characters.
2. Set `REQUIRE_DATABASE=1` and the initial admin name and email. Add a separate random `INITIAL_ADMIN_SETUP_TOKEN` of at least 32 characters as a Sensitive Vercel environment variable. Never commit the token.
3. Open `/setup`, enter that token, and choose the administrator password. Setup is available only while the users collection is empty, and closes after the first account is created. The setup endpoint also creates the required indexes.
4. Sign in, then create librarian and student accounts from People & access. Use a unique 12-character-or-longer password for each account.

Alternatively, use the local admin script if you have MongoDB credentials in `.env.local`:

   ```sh
   npm run create-admin -- "Your Name" you@example.com administrator
   ```

   The script prompts for the account password and stores a salted scrypt hash. It creates the unique email, book search, loan, and reservation indexes.

The sign-in page is available at `/login`. Each account signs in with its email and password; its saved role opens the matching workspace. Passwords use salted scrypt hashes, sessions use signed HttpOnly cookies, and account access can be disabled or restored. Reads and writes go through server-side API functions. Password hashes and MongoDB connection strings are never sent to the frontend.

The `/api` files use Vercel serverless-function routing. Bolt can import and edit this GitHub project, but publishing it with Bolt Cloud while retaining MongoDB requires a backend runtime that can run these server-side routes and safely hold the MongoDB secret. Bolt's built-in database and hosting are separate from this project's MongoDB API.

## Collections

- `users`: name, normalized email, scrypt password hash, role, and status.
- `books`: title, author, category, ISBN, shelf, copy count, and available count.
- `loans`: book, member, due date, and return status.
- `reservations`: requested book, member, review status, and timestamps.
- `settings`: library name, contact email, and default loan period.

MongoDB is required in production. The deployed database health endpoint reports whether it can connect; live sign-in also requires a valid session secret and at least one administrator account.
