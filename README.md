SEO HIRING EXAM — RENDER + POSTGRES VERSION

This version is designed for real multi-device submissions.

STACK
- Node.js + Express
- PostgreSQL
- Responsive candidate page
- Secure admin API key
- Server-side MCQ scoring
- Central candidate database

RENDER DEPLOYMENT
1. Create a PostgreSQL database (Render Postgres or Supabase).
2. Create a new Render Web Service from this folder/repository.
3. Build command: npm install
4. Start command: npm start
5. Add environment variables:
   DATABASE_URL = your PostgreSQL connection string
   ADMIN_KEY = a strong private password
6. Deploy.
7. Candidate URL: https://YOUR-SERVICE.onrender.com/
8. Admin URL: https://YOUR-SERVICE.onrender.com/admin

IMPORTANT
Do not share the /admin URL or ADMIN_KEY with candidates.
This package has no payment system and no candidate login; candidates only submit their name/mobile/email.
For production, put the project in a GitHub repo and deploy it to Render.
