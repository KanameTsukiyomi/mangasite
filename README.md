# MangaSite

Plataforma de lectura de manga, manhwa, manhua, webtoons y novelas web. Bilingüe (ES/EN), con sistema de monedas, pagos y bloqueo de capítulos.

## Stack
- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express (TypeScript)
- **Base de datos**: Supabase (PostgreSQL + Storage + Auth)
- **Pagos**: Stripe · PayPal · Binance Pay
- **Hosting gratuito**: Vercel (frontend) · Render (backend) · Supabase (DB)

## Inicio rápido

### Requisitos
- Node.js 18+
- Cuenta en [supabase.com](https://supabase.com) (gratuita)
- Cuenta en [vercel.com](https://vercel.com) (gratuita)
- Cuenta en [render.com](https://render.com) (gratuita)

### 1. Configurar Supabase
1. Crear proyecto en supabase.com
2. Ir a **SQL Editor** y ejecutar los archivos de `supabase/migrations/` en orden:
   - `001_schema.sql`
   - `002_rls.sql`
   - `003_seed.sql`
   - `004_triggers.sql`
3. En **Storage**, crear un bucket llamado `chapter-pages` (público)
4. Copiar la URL y las claves de API desde Settings → API

### 2. Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de Supabase y pasarelas de pago
npm install
npm run dev
# Corre en http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase y URL del backend
npm install
npm run dev
# Corre en http://localhost:3000
```

## Estructura
```
mangasite/
├── backend/          # API Node.js/Express (TypeScript)
├── frontend/         # Aplicación Next.js 14
└── supabase/
    └── migrations/   # Scripts SQL para crear la base de datos
```

## Variables de entorno necesarias

Ver `backend/.env.example` y `frontend/.env.example`.

## Despliegue gratuito

### Frontend → Vercel
1. Conectar el repositorio en vercel.com
2. Seleccionar la carpeta `frontend` como raíz
3. Agregar las variables de entorno desde `.env.example`

### Backend → Render
1. Crear un "Web Service" en render.com
2. Seleccionar la carpeta `backend` como raíz
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Agregar las variables de entorno desde `.env.example`
