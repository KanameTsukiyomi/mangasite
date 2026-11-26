/**
 * Aplica las variables CSS de color desde site_settings al :root del documento.
 * Llamado por ThemeProvider al iniciar la app.
 */
export function applyTheme(settings: Record<string, string>) {
  const root = document.documentElement;
  const colorKeys: Record<string, string> = {
    color_primary:    '--color-primary',
    color_secondary:  '--color-secondary',
    color_bg:         '--color-bg',
    color_card:       '--color-card',
    color_text:       '--color-text',
    color_text_muted: '--color-text-muted',
    color_accent:     '--color-accent',
    color_border:     '--color-border',
  };

  for (const [key, cssVar] of Object.entries(colorKeys)) {
    if (settings[key]) {
      root.style.setProperty(cssVar, settings[key]);
    }
  }

  // También actualizar el nombre del sitio si viene
  if (settings.site_name) {
    document.title = settings.site_name;
  }
}
