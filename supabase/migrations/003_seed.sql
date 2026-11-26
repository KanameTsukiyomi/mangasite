-- ============================================================
-- 003_seed.sql — Datos iniciales
-- ============================================================

-- ============================================================
-- CONFIGURACIÓN DEL SITIO
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name',           'MangaSite'),
  ('site_tagline_es',     'Lee manga, manhwa y novelas gratis'),
  ('site_tagline_en',     'Read manga, manhwa and novels for free'),
  ('site_logo_url',       ''),
  ('site_favicon_url',    ''),
  -- Colores del tema (personalizables desde el panel admin)
  ('color_primary',       '#e11d48'),
  ('color_secondary',     '#1e1b4b'),
  ('color_bg',            '#0f0f0f'),
  ('color_card',          '#1a1a2e'),
  ('color_text',          '#f1f5f9'),
  ('color_text_muted',    '#94a3b8'),
  ('color_accent',        '#f59e0b'),
  ('color_border',        '#2d2d44'),
  -- Sistema de monedas
  ('coins_name_es',       'Monedas'),
  ('coins_name_en',       'Coins'),
  ('coins_icon',          '🪙'),
  -- Redes sociales
  ('social_twitter',      ''),
  ('social_discord',      ''),
  ('social_instagram',    ''),
  -- SEO
  ('meta_description_es', 'Lee manga, manhwa, manhua, webtoons y novelas web en español.'),
  ('meta_description_en', 'Read manga, manhwa, manhua, webtoons and web novels in English.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- GÉNEROS
-- ============================================================
INSERT INTO public.genres (slug) VALUES
  ('action'), ('adventure'), ('comedy'), ('drama'), ('fantasy'),
  ('horror'), ('mystery'), ('romance'), ('sci-fi'), ('slice-of-life'),
  ('sports'), ('supernatural'), ('thriller'), ('historical'), ('isekai'),
  ('shoujo'), ('shounen'), ('seinen'), ('josei'), ('ecchi'),
  ('harem'), ('martial-arts'), ('mecha'), ('psychological'), ('school-life'),
  ('magic'), ('demons'), ('vampires'), ('zombies'), ('survival')
ON CONFLICT (slug) DO NOTHING;

-- Traducciones ES
INSERT INTO public.genre_translations (genre_id, language, name)
SELECT g.id, 'es', t.name FROM public.genres g
JOIN (VALUES
  ('action',       'Acción'),
  ('adventure',    'Aventura'),
  ('comedy',       'Comedia'),
  ('drama',        'Drama'),
  ('fantasy',      'Fantasía'),
  ('horror',       'Terror'),
  ('mystery',      'Misterio'),
  ('romance',      'Romance'),
  ('sci-fi',       'Ciencia Ficción'),
  ('slice-of-life','Slice of Life'),
  ('sports',       'Deportes'),
  ('supernatural', 'Sobrenatural'),
  ('thriller',     'Thriller'),
  ('historical',   'Histórico'),
  ('isekai',       'Isekai'),
  ('shoujo',       'Shoujo'),
  ('shounen',      'Shounen'),
  ('seinen',       'Seinen'),
  ('josei',        'Josei'),
  ('ecchi',        'Ecchi'),
  ('harem',        'Harem'),
  ('martial-arts', 'Artes Marciales'),
  ('mecha',        'Mecha'),
  ('psychological','Psicológico'),
  ('school-life',  'Vida Escolar'),
  ('magic',        'Magia'),
  ('demons',       'Demonios'),
  ('vampires',     'Vampiros'),
  ('zombies',      'Zombies'),
  ('survival',     'Supervivencia')
) AS t(slug, name) ON g.slug = t.slug
ON CONFLICT DO NOTHING;

-- Traducciones EN
INSERT INTO public.genre_translations (genre_id, language, name)
SELECT g.id, 'en', t.name FROM public.genres g
JOIN (VALUES
  ('action',       'Action'),
  ('adventure',    'Adventure'),
  ('comedy',       'Comedy'),
  ('drama',        'Drama'),
  ('fantasy',      'Fantasy'),
  ('horror',       'Horror'),
  ('mystery',      'Mystery'),
  ('romance',      'Romance'),
  ('sci-fi',       'Sci-Fi'),
  ('slice-of-life','Slice of Life'),
  ('sports',       'Sports'),
  ('supernatural', 'Supernatural'),
  ('thriller',     'Thriller'),
  ('historical',   'Historical'),
  ('isekai',       'Isekai'),
  ('shoujo',       'Shoujo'),
  ('shounen',      'Shounen'),
  ('seinen',       'Seinen'),
  ('josei',        'Josei'),
  ('ecchi',        'Ecchi'),
  ('harem',        'Harem'),
  ('martial-arts', 'Martial Arts'),
  ('mecha',        'Mecha'),
  ('psychological','Psychological'),
  ('school-life',  'School Life'),
  ('magic',        'Magic'),
  ('demons',       'Demons'),
  ('vampires',     'Vampires'),
  ('zombies',      'Zombies'),
  ('survival',     'Survival')
) AS t(slug, name) ON g.slug = t.slug
ON CONFLICT DO NOTHING;

-- ============================================================
-- PAQUETES DE MONEDAS INICIALES
-- ============================================================
INSERT INTO public.coin_packages (name, coins_amount, bonus_coins, price_usd, sort_order) VALUES
  ('Starter',    50,    0,  0.99, 1),
  ('Basic',     100,    5,  1.99, 2),
  ('Standard',  300,   20,  4.99, 3),
  ('Popular',   500,   50,  7.99, 4),
  ('Premium',  1000,  150, 14.99, 5),
  ('Ultimate', 2500,  500, 29.99, 6)
ON CONFLICT DO NOTHING;
