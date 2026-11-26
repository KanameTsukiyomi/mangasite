-- ============================================================
-- 002_rls.sql — Row Level Security Policies
-- ============================================================

ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_translations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genre_translations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_genres          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_translations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_pages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novel_content          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_packages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners                ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES — lectura pública, actualización solo propia
-- ============================================================
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- SERIES y catálogos — lectura pública total
-- ============================================================
CREATE POLICY "series_public_read"             ON series              FOR SELECT USING (TRUE);
CREATE POLICY "series_translations_public_read" ON series_translations FOR SELECT USING (TRUE);
CREATE POLICY "genres_public_read"             ON genres              FOR SELECT USING (TRUE);
CREATE POLICY "genre_translations_public_read" ON genre_translations  FOR SELECT USING (TRUE);
CREATE POLICY "series_genres_public_read"      ON series_genres       FOR SELECT USING (TRUE);

-- ============================================================
-- CAPÍTULOS — metadatos públicos, CONTENIDO protegido
-- El backend usa service_role_key (bypasea RLS) para leer
-- chapter_pages y novel_content. Clientes directos: denegado.
-- ============================================================
CREATE POLICY "chapters_public_read"           ON chapters            FOR SELECT USING (TRUE);
CREATE POLICY "chapter_translations_public"    ON chapter_translations FOR SELECT USING (TRUE);
CREATE POLICY "chapter_pages_backend_only"     ON chapter_pages       FOR SELECT USING (FALSE);
CREATE POLICY "novel_content_backend_only"     ON novel_content       FOR SELECT USING (FALSE);

-- ============================================================
-- USER_UNLOCKED_CHAPTERS — solo el propio usuario puede leer
-- Escritura solo desde el backend (service role)
-- ============================================================
CREATE POLICY "unlocked_own_read"   ON user_unlocked_chapters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "unlocked_no_insert"  ON user_unlocked_chapters FOR INSERT WITH CHECK (FALSE);

-- ============================================================
-- USER_LIBRARY — CRUD propio
-- ============================================================
CREATE POLICY "library_own_read"   ON user_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "library_own_insert" ON user_library FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "library_own_update" ON user_library FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "library_own_delete" ON user_library FOR DELETE  USING (auth.uid() = user_id);

-- ============================================================
-- USER_READING_HISTORY — CRUD propio
-- ============================================================
CREATE POLICY "history_own_read"   ON user_reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "history_own_insert" ON user_reading_history FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "history_own_update" ON user_reading_history FOR UPDATE  USING (auth.uid() = user_id);

-- ============================================================
-- COIN_PACKAGES — lectura pública de paquetes activos
-- ============================================================
CREATE POLICY "packages_public_read" ON coin_packages FOR SELECT USING (is_active = TRUE);

-- ============================================================
-- COIN_TRANSACTIONS — solo el propio usuario puede leer las suyas
-- Escritura solo desde el backend
-- ============================================================
CREATE POLICY "transactions_own_read"   ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_no_insert"  ON coin_transactions FOR INSERT  WITH CHECK (FALSE);

-- ============================================================
-- COMMENTS — lectura pública, escritura autenticada
-- ============================================================
CREATE POLICY "comments_public_read"  ON comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "comments_auth_insert"  ON comments FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_own_update"   ON comments FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "comments_own_delete"   ON comments FOR DELETE  USING (auth.uid() = user_id);

-- ============================================================
-- RATINGS — lectura pública, CRUD propio
-- ============================================================
CREATE POLICY "ratings_public_read" ON ratings FOR SELECT USING (TRUE);
CREATE POLICY "ratings_own_insert"  ON ratings FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_own_update"  ON ratings FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "ratings_own_delete"  ON ratings FOR DELETE  USING (auth.uid() = user_id);

-- ============================================================
-- SITE_SETTINGS — lectura pública, escritura solo service role
-- ============================================================
CREATE POLICY "settings_public_read" ON site_settings FOR SELECT USING (TRUE);

-- ============================================================
-- BANNERS — lectura pública de los activos y vigentes
-- ============================================================
CREATE POLICY "banners_public_read" ON banners FOR SELECT USING (
  is_active = TRUE
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (ends_at   IS NULL OR ends_at   >= NOW())
);
