-- ============================================================
-- 001_schema.sql — MangaSite: Esquema inicial de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- PERFILES DE USUARIO
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'moderator', 'admin')),
  coins_balance INTEGER NOT NULL DEFAULT 0 CHECK (coins_balance >= 0),
  language      TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  bio           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERIES (manga, manhwa, manhua, webtoon, novela)
-- ============================================================
CREATE TABLE public.series (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  type          TEXT NOT NULL
                  CHECK (type IN ('manga', 'manhwa', 'manhua', 'webtoon', 'novel')),
  status        TEXT NOT NULL DEFAULT 'ongoing'
                  CHECK (status IN ('ongoing', 'completed', 'hiatus', 'dropped')),
  cover_url     TEXT,
  banner_url    TEXT,
  views         BIGINT DEFAULT 0,
  avg_rating    NUMERIC(3,2) DEFAULT 0,
  rating_count  INTEGER DEFAULT 0,
  is_featured   BOOLEAN DEFAULT FALSE,
  is_hot        BOOLEAN DEFAULT FALSE,
  is_new        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_series_type      ON series(type);
CREATE INDEX idx_series_status    ON series(status);
CREATE INDEX idx_series_updated   ON series(updated_at DESC);
CREATE INDEX idx_series_featured  ON series(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_series_views     ON series(views DESC);

-- ============================================================
-- TRADUCCIONES DE SERIES (ES / EN)
-- ============================================================
CREATE TABLE public.series_translations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id   UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  language    TEXT NOT NULL CHECK (language IN ('es', 'en')),
  title       TEXT NOT NULL,
  alt_titles  TEXT[] DEFAULT '{}',
  description TEXT,
  author      TEXT,
  artist      TEXT,
  UNIQUE(series_id, language)
);

CREATE INDEX idx_series_trans_trgm ON series_translations
  USING gin(title gin_trgm_ops);
CREATE INDEX idx_series_trans_fts_es ON series_translations
  USING gin(to_tsvector('spanish', title)) WHERE language = 'es';
CREATE INDEX idx_series_trans_fts_en ON series_translations
  USING gin(to_tsvector('english', title)) WHERE language = 'en';

-- ============================================================
-- GÉNEROS
-- ============================================================
CREATE TABLE public.genres (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  TEXT UNIQUE NOT NULL
);

CREATE TABLE public.genre_translations (
  genre_id  UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  language  TEXT NOT NULL CHECK (language IN ('es', 'en')),
  name      TEXT NOT NULL,
  PRIMARY KEY (genre_id, language)
);

CREATE TABLE public.series_genres (
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  genre_id  UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (series_id, genre_id)
);

-- ============================================================
-- CAPÍTULOS
-- ============================================================
CREATE TABLE public.chapters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id       UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  chapter_number  NUMERIC(8,1) NOT NULL,
  volume_number   INTEGER,
  is_free         BOOLEAN NOT NULL DEFAULT TRUE,
  coin_cost       INTEGER NOT NULL DEFAULT 0 CHECK (coin_cost >= 0),
  free_after_days INTEGER,
  views           BIGINT DEFAULT 0,
  pages_count     INTEGER DEFAULT 0,
  published_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_id, chapter_number)
);

CREATE INDEX idx_chapters_series    ON chapters(series_id, chapter_number);
CREATE INDEX idx_chapters_published ON chapters(published_at DESC);

CREATE TABLE public.chapter_translations (
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  language   TEXT NOT NULL CHECK (language IN ('es', 'en')),
  title      TEXT,
  PRIMARY KEY (chapter_id, language)
);

-- ============================================================
-- PÁGINAS DE CAPÍTULOS (cómics / manhwa / webtoon)
-- ============================================================
CREATE TABLE public.chapter_pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id   UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  page_number  INTEGER NOT NULL,
  image_url    TEXT NOT NULL,
  UNIQUE(chapter_id, page_number)
);

CREATE INDEX idx_pages_chapter ON chapter_pages(chapter_id, page_number);

-- ============================================================
-- CONTENIDO DE NOVELAS
-- ============================================================
CREATE TABLE public.novel_content (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  language   TEXT NOT NULL CHECK (language IN ('es', 'en')),
  content    TEXT NOT NULL,
  UNIQUE(chapter_id, language)
);

-- ============================================================
-- CAPÍTULOS DESBLOQUEADOS POR USUARIO
-- ============================================================
CREATE TABLE public.user_unlocked_chapters (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id   UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  coins_spent  INTEGER NOT NULL,
  unlocked_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, chapter_id)
);

CREATE INDEX idx_unlocked_user ON user_unlocked_chapters(user_id);

-- ============================================================
-- BIBLIOTECA DE USUARIO (favoritos / seguimiento)
-- ============================================================
CREATE TABLE public.user_library (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  series_id  UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'reading'
               CHECK (status IN ('reading', 'completed', 'on_hold', 'dropped', 'plan_to_read')),
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, series_id)
);

CREATE INDEX idx_library_user ON user_library(user_id, updated_at DESC);

-- ============================================================
-- HISTORIAL DE LECTURA
-- ============================================================
CREATE TABLE public.user_reading_history (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id   UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  page_number  INTEGER DEFAULT 1,
  read_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, chapter_id)
);

CREATE INDEX idx_history_user ON user_reading_history(user_id, read_at DESC);

-- ============================================================
-- PAQUETES DE MONEDAS
-- ============================================================
CREATE TABLE public.coin_packages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  coins_amount INTEGER NOT NULL CHECK (coins_amount > 0),
  bonus_coins  INTEGER NOT NULL DEFAULT 0 CHECK (bonus_coins >= 0),
  price_usd    NUMERIC(8,2) NOT NULL CHECK (price_usd > 0),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACCIONES DE MONEDAS
-- ============================================================
CREATE TABLE public.coin_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type              TEXT NOT NULL
                      CHECK (type IN ('purchase', 'spend', 'refund', 'bonus', 'admin_grant')),
  amount            INTEGER NOT NULL,
  balance_after     INTEGER NOT NULL,
  description       TEXT,
  payment_provider  TEXT CHECK (payment_provider IN ('stripe', 'paypal', 'binance', NULL)),
  payment_reference TEXT,
  package_id        UUID REFERENCES coin_packages(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'completed'
                      CHECK (status IN ('pending', 'completed', 'failed')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user      ON coin_transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_reference ON coin_transactions(payment_reference)
  WHERE payment_reference IS NOT NULL;

-- ============================================================
-- COMENTARIOS
-- ============================================================
CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  series_id   UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  chapter_id  UUID REFERENCES chapters(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_series  ON comments(series_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_chapter ON comments(chapter_id, created_at DESC)
  WHERE is_deleted = FALSE AND chapter_id IS NOT NULL;
CREATE INDEX idx_comments_parent  ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================================
-- VALORACIONES
-- ============================================================
CREATE TABLE public.ratings (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  series_id  UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, series_id)
);

-- ============================================================
-- CONFIGURACIÓN DEL SITIO (colores, nombre, etc.)
-- ============================================================
CREATE TABLE public.site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BANNERS / SLIDERS
-- ============================================================
CREATE TABLE public.banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  image_url   TEXT NOT NULL,
  link        TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON banners(position) WHERE is_active = TRUE;
