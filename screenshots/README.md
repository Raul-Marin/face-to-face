# Screenshots de componentes

Las vistas previas intentan cargar PNG estáticos desde `ios/` y `md/`. Si no existen, se usa el embed de Figma como fallback.

## Generar screenshots

1. Obtén un [Figma Access Token](https://www.figma.com/developers/api#access-tokens) (desde tu cuenta Figma).
2. Ejecuta:

```bash
FIGMA_ACCESS_TOKEN=tu_token node scripts/fetch-figma-screenshots.mjs
```

Los PNG se guardan en `screenshots/ios/` y `screenshots/md/`.
