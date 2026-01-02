# Configuración de Massive API

Esta guía te ayudará a configurar la integración con Massive API para obtener datos reales del mercado.

## Pasos de Configuración

### 1. Obtener API Key de Massive

1. Visita [https://massive.com](https://massive.com)
2. Crea una cuenta o inicia sesión
3. Navega a la sección de API Keys
4. Genera una nueva API key
5. Copia la API key (la necesitarás en el siguiente paso)

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Massive API Configuration
MASSIVE_API_KEY=tu_api_key_aqui

# Enable Massive API integration
NEXT_PUBLIC_USE_MASSIVE=true
```

**Importante:**
- Reemplaza `tu_api_key_aqui` con tu API key real de Massive
- El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio
- Nunca compartas tu API key públicamente

### 3. Reiniciar el Servidor de Desarrollo

Después de crear o modificar el archivo `.env.local`, reinicia el servidor de desarrollo:

```bash
# Detén el servidor actual (Ctrl+C)
# Luego reinicia
npm run dev
```

## Verificación

### Test Rápido de Opciones

Para probar la integración con Massive y ver los datos en la consola:

1. **Asegúrate de tener el servidor corriendo:**
   ```bash
   npm run dev
   ```

2. **Abre tu navegador y visita:**
   ```
   http://localhost:3000/api/test/massive-options?symbol=AAPL
   ```

3. **Revisa la consola del servidor** (donde ejecutaste `npm run dev`) para ver:
   - La respuesta completa de Massive
   - Los datos mapeados
   - Estadísticas de contratos
   - Información detallada de cada contrato

4. **También puedes probar con otros símbolos:**
   ```
   http://localhost:3000/api/test/massive-options?symbol=SPY
   http://localhost:3000/api/test/massive-options?symbol=QQQ
   ```

### Uso Normal en la Aplicación

Una vez configurado, la aplicación:

1. Intentará usar Massive API cuando `NEXT_PUBLIC_USE_MASSIVE=true`
2. Mostrará datos reales del mercado en el dashboard
3. Si hay algún error con Massive, automáticamente usará datos mock como fallback

## Desactivar Massive (Usar Datos Mock)

Si quieres usar datos mock en lugar de Massive:

1. Edita `.env.local` y cambia:
   ```env
   NEXT_PUBLIC_USE_MASSIVE=false
   ```

2. O simplemente elimina/comenta la línea `NEXT_PUBLIC_USE_MASSIVE`

3. Reinicia el servidor

## Solución de Problemas

### Error: "MASSIVE_API_KEY not configured on the server"

- Verifica que el archivo `.env.local` existe en la raíz del proyecto
- Verifica que `MASSIVE_API_KEY` está configurado correctamente
- Reinicia el servidor de desarrollo después de crear/modificar `.env.local`

### Error: "Massive API error 401"

- Tu API key es inválida o ha expirado
- Verifica que copiaste la API key correctamente (sin espacios extra)
- Genera una nueva API key en el dashboard de Massive

### Error: "Massive API error 429"

- Has excedido el límite de rate limiting de Massive
- Espera unos minutos antes de intentar de nuevo
- Considera aumentar los TTL (time-to-live) en `src/services/massive.ts` para reducir las llamadas

### Los datos siguen siendo mock

- Verifica que `NEXT_PUBLIC_USE_MASSIVE=true` en `.env.local`
- Verifica la consola del navegador y del servidor para ver errores
- La aplicación usa datos mock como fallback si Massive falla

## Estructura de la Integración

```
Cliente (app/page.tsx)
  ↓
Verifica NEXT_PUBLIC_USE_MASSIVE
  ↓
Rutas API del servidor (app/api/massive/*)
  ↓
Servicio massive.ts (src/services/massive.ts)
  ↓
Massive API (https://api.massive.com/v3)
  ↓
Mapper (src/services/massive-mapper.ts)
  ↓
Datos normalizados → Dashboard
```

## Características

- **Caché inteligente**: Los datos se cachean en memoria con TTL configurable
- **Reintentos automáticos**: Si una llamada falla, se reintenta con backoff exponencial
- **Múltiples endpoints**: Prueba diferentes rutas de la API hasta encontrar una que funcione
- **Fallback automático**: Si Massive falla, automáticamente usa datos mock
- **Mapeo flexible**: Maneja diferentes estructuras de respuesta de Massive

## Configuración Avanzada

Puedes ajustar los tiempos de caché y reintentos en `src/services/massive.ts`:

```typescript
export const MassiveConfig = {
  defaults: {
    callTtlSeconds: 15,      // TTL general
    marketTtlSeconds: 8,     // TTL para datos de mercado
    optionsTtlSeconds: 30,   // TTL para opciones
    ivTtlSeconds: 60,        // TTL para IV histórica
    retries: 2,              // Número de reintentos
    baseDelayMs: 100,        // Delay base para backoff
  },
};
```

