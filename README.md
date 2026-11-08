# SmartLib

SmartLib is a library management workspace based on the student, librarian, administrator, and sign-in screens bundled with the Vercel project. The workspace includes a responsive preview UI, a MongoDB-backed API, and role-aware sign-in.

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

After the database is reachable, the site offers library-account sign-in. Live catalog, loan, and reservation reads and writes go through server-side API functions. Password hashes are excluded from account-list responses. The frontend never receives the MongoDB connection string. If the Vercel project already has these variables, keep their existing values and redeploy the app to activate them.

## Collections

- `users`: name, normalized email, scrypt password hash, role, and status.
- `books`: title, author, category, ISBN, shelf, copy count, and available count.
- `loans`: book, member, due date, and return status.
- `reservations`: requested book, member, review status, and timestamps.

Preview records are separate from MongoDB. MongoDB persistence becomes active only after this app is deployed, the environment variables are configured, and at least one library account has been created.
