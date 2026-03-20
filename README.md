# Grafo iOS ↔ Material Design (kits Figma)

Visualización interactiva de **correspondencias** entre los ítems de tu lista **iOS** y **Components Android** (Material 3). Incluye grado de similitud (**alta** / **media** / **baja**) y nodos **sin par** cuando no hay equivalente razonable en la otra lista.

## Cómo abrirlo

1. Abre **`index.html`** en el navegador (doble clic o arrastrar al Chrome/Safari/Firefox).  
   - Funciona sin servidor gracias a `graph-data.js`.
2. Si editas **`data.json`**, vuelve a generar el JS embebido:

```bash
cd ios-material-pattern-graph
python3 -c "
import json
with open('data.json') as f:
    d = json.load(f)
print('window.__GRAPH__ = ' + json.dumps(d, ensure_ascii=False) + ';')
" > graph-data.js
```

## Archivos

| Archivo | Rol |
|---------|-----|
| `index.html` | Página + vis-network (CDN) |
| `styles.css` | Tema oscuro |
| `app.js` | Construye nodos fijos en dos columnas y aristas coloreadas |
| `data.json` | Fuente de verdad (nodos, aristas, notas) |
| `graph-data.js` | Copia de los datos en `window.__GRAPH__` para `file://` |

## Criterio de correspondencia

- **Alta**: misma intención de UX en la mayoría de productos nativos.  
- **Media**: parcial (distinto contenedor, modal vs inline, etc.).  
- **Baja**: analogía débil; no copiar el patrón tal cual al otro OS.  
- **Sin arista / nodo gris**: biometría, teclado del sistema, compartir nativo, etc.

Es una herramienta **didáctica**, no una especificación de Apple o Google.

## Enlace con el resto del repo

- Tabla para montar pantallas en Figma: [`../docs/FIGMA_PICKLIST_SIMULADOR.md`](../docs/FIGMA_PICKLIST_SIMULADOR.md)  
- Ejercicio de clase: [`../EXERCISE_PATRONES_IOS_ANDROID.md`](../EXERCISE_PATRONES_IOS_ANDROID.md)
