# SmartLib

SmartLib is a library management workspace with responsive student, librarian, and administrator screens, a MongoDB-backed API, and role-aware sign-in. Books, loans, reservations, member accounts, and library settings are stored in MongoDB when the live database is configured. Preview mode uses local browser storage.

## Run the preview

Install the dependencies and start Vercel's local development server:

```sh
npm install
npm run dev
```

Without MongoDB settings, the website opens in preview mode with sample records stored in browser local storage. Use the profile card in the sidebar to cycle through the student, librarian, and administrator previews.

## Connect MongoDB

1. Create a MongoDB database and a database user with access limited to that database.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` and a random `SESSION_SECRET` with at least 32 characters. Set `MONGODB_DB` only if your connection string does not already name the database.
3. Create the first account and any staff or student accounts:

   ```sh
   npm run create-admin -- "Taylor Morgan" taylor@example.edu administrator
   npm run create-admin -- "Jamie Rivera" jamie@example.edu librarian
   npm run create-admin -- "Alex Morgan" alex@example.edu student
   ```

   The script prompts for each account password and stores a salted scrypt hash. The first invocation also creates the unique email, book search, loan, and reservation indexes.
4. In Vercel Project Settings → Environment Variables, confirm `MONGODB_URI` and `SESSION_SECRET` are set for the environments you will use. Set `MONGODB_DB` only when needed. Keep these values server-only. Redeploy after changing them.

After the database is reachable, the site offers library-account sign-in. Live catalog, loan, reservation, account, and settings reads and writes go through server-side API functions. Administrators can create student and librarian accounts with a temporary password, and the password is stored as a salted scrypt hash. Password hashes are excluded from account-list responses. The frontend never receives the MongoDB connection string. If the Vercel project already has these variables, keep their existing values and redeploy the app to activate them.

The `/api` files use Vercel serverless-function routing. Bolt can import and edit this GitHub project, but publishing it with Bolt Cloud while retaining MongoDB requires a backend runtime that can run these server-side routes and safely hold the MongoDB secret. Bolt's built-in database and hosting are separate from this project's MongoDB API.

## Collections

- `users`: name, normalized email, scrypt password hash, role, and status.
- `books`: title, author, category, ISBN, shelf, copy count, and available count.
- `loans`: book, member, due date, and return status.
- `reservations`: requested book, member, review status, and timestamps.
- `settings`: library name, contact email, and default loan period.

Preview records are separate from MongoDB. MongoDB persistence becomes active only after this app is deployed, the environment variables are configured, and at least one library account has been created.
