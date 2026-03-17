# Backend (FastAPI + Supabase)

## Run

```bash
pip install -r requirements.txt
# Create backend/.env from .env.example and set SUPABASE_URL + SUPABASE_SERVICE_KEY
python -m uvicorn main:app --reload
```

## Create event & Join event

Create event and Join/Leave event **require the Supabase service_role key** in `backend/.env` as `SUPABASE_SERVICE_KEY`. The anon key only has read access under Row Level Security (RLS); writes will be denied.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **API**.
2. Copy the **service_role** key (secret, not the anon key).
3. In `backend/.env` set: `SUPABASE_SERVICE_KEY=<paste service_role key>`.
4. Ensure `SUPABASE_URL` is set in `backend/.env` (same as above). Restart the backend.

**Authentication:** Create event and Join/Leave require a logged-in user. The frontend uses Supabase Auth and sends the JWT in the `Authorization: Bearer <token>` header. The backend verifies the token using Supabase's **JWKS endpoint** (asymmetric ECC/RSA keys). No JWT secret is required; `SUPABASE_URL` is used to fetch public keys from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
