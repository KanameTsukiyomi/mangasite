-- ============================================================
-- 004_triggers.sql — Triggers de PostgreSQL
-- ============================================================

-- ============================================================
-- Auto-crear perfil al registrarse (trigger en auth.users)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generar username desde email, limpiar y limitar
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '_', 'g');
  base_username := LEFT(base_username, 20);
  final_username := base_username;

  -- Resolver colisiones de username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := LEFT(base_username, 17) || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, role, coins_balance, language)
  VALUES (
    NEW.id,
    final_username,
    'user',
    0,
    COALESCE(NEW.raw_user_meta_data->>'language', 'es')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Auto-actualizar updated_at en tablas que lo tienen
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER series_updated_at
  BEFORE UPDATE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER library_updated_at
  BEFORE UPDATE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Recalcular avg_rating de la serie cuando se vota
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_series_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_series_id UUID;
BEGIN
  target_series_id := COALESCE(NEW.series_id, OLD.series_id);

  UPDATE public.series
  SET
    avg_rating   = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.ratings WHERE series_id = target_series_id), 0),
    rating_count = (SELECT COUNT(*) FROM public.ratings WHERE series_id = target_series_id)
  WHERE id = target_series_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_series_rating();

-- ============================================================
-- Actualizar series.updated_at al insertar un capítulo
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_series_on_chapter_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.series SET updated_at = NOW() WHERE id = NEW.series_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_chapter_insert
  AFTER INSERT ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_series_on_chapter_insert();

-- ============================================================
-- Mantener pages_count sincronizado al subir/borrar páginas
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_pages_count()
RETURNS TRIGGER AS $$
DECLARE
  target_chapter_id UUID;
BEGIN
  target_chapter_id := COALESCE(NEW.chapter_id, OLD.chapter_id);
  UPDATE public.chapters
  SET pages_count = (SELECT COUNT(*) FROM public.chapter_pages WHERE chapter_id = target_chapter_id)
  WHERE id = target_chapter_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_page_change
  AFTER INSERT OR DELETE ON public.chapter_pages
  FOR EACH ROW EXECUTE FUNCTION public.sync_pages_count();
