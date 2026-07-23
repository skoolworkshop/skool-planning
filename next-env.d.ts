# Postgres connection string (Neon, Supabase, Vercel Postgres of lokaal)
DATABASE_URL="postgresql://user:password@localhost:5432/skoolworkshop?schema=public"

# Willekeurige lange geheime sleutel voor sessies (minimaal 32 tekens)
AUTH_SECRET="verander-dit-in-een-lange-willekeurige-string-van-minstens-32-tekens"

# Basis-URL van de applicatie, gebruikt in e-mails en uitnodigingslinks
APP_URL="http://localhost:3000"

# Notificaties. dev = niets echt versturen, alleen loggen in de berichtenlog
NOTIFY_MODE="dev"

# E-mail provider (alleen nodig als NOTIFY_MODE=live)
EMAIL_PROVIDER="resend"
RESEND_API_KEY=""
EMAIL_FROM="planning@skoolworkshop.nl"

# WhatsApp Business API (alleen nodig als NOTIFY_MODE=live)
WHATSAPP_PROVIDER="meta"
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_TOKEN=""

# Wachtwoord voor de demo accounts uit de seed
SEED_WACHTWOORD="SkoolDemo2026!"

# Token voor de eenmalige seed via /api/seed. Leeg laten zodra je live gaat
SEED_TOKEN=""
