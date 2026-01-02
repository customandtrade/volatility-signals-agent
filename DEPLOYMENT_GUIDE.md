# Guía de Despliegue - Massive API

## ¿Qué pasa cuando haces push a GitHub?

### ✅ Lo que SÍ se sube:
- Todo el código fuente
- Configuración de Next.js
- Estructura de archivos
- Componentes y servicios

### ❌ Lo que NO se sube (y está bien):
- `.env.local` - Variables de entorno locales (está en `.gitignore`)
- `MASSIVE_API_KEY` - Tu API key secreta
- Otras variables sensibles

## ¿Funcionará en producción?

**SÍ, funcionará perfectamente**, pero necesitas configurar las variables de entorno en tu plataforma de hosting.

## ¿Necesitas WebSocket?

**NO, NO necesitas WebSocket**. El código actual funciona perfectamente con HTTP normal:

### Cómo funciona actualmente:

```
Cliente (Navegador)
  ↓ HTTP fetch()
Rutas API del servidor (/api/massive/*)
  ↓ HTTP fetch() con API key
Massive API (https://api.massive.com/v3)
  ↓ Respuesta JSON
Servidor procesa y mapea datos
  ↓ Respuesta JSON
Cliente recibe y muestra datos
```

### Polling vs WebSocket:

**Actual (Polling con HTTP):**
- ✅ Funciona perfectamente en producción
- ✅ Más simple de implementar
- ✅ No requiere configuración adicional
- ✅ Auto-refresh cada 30 segundos
- ✅ Funciona con cualquier hosting (Vercel, Netlify, etc.)

**WebSocket (si quisieras):**
- ⚠️ Más complejo de implementar
- ⚠️ Requiere servidor persistente (no funciona bien en serverless)
- ⚠️ Más costoso
- ✅ Actualizaciones en tiempo real instantáneas
- ❌ **NO es necesario** para tu caso de uso

## Configuración para Producción

### Si usas Vercel:

1. **Push a GitHub:**
   ```bash
   git add .
   git commit -m "Add Massive API integration"
   git push origin main
   ```

2. **Configurar variables en Vercel:**
   - Ve a: https://vercel.com/dashboard
   - Selecciona tu proyecto
   - Settings → Environment Variables
   - Agrega:
     ```
     MASSIVE_API_KEY=tu_api_key_aqui
     NEXT_PUBLIC_USE_MASSIVE=true
     NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
     ```

3. **Redeploy:**
   - Vercel detectará el push automáticamente
   - O manualmente: Deployments → Redeploy

### Si usas otra plataforma:

**Netlify, Railway, Render, etc.:**
- Mismo proceso: agregar variables de entorno en el dashboard
- La variable `MASSIVE_API_KEY` debe estar disponible en el servidor
- `NEXT_PUBLIC_USE_MASSIVE=true` debe estar disponible en el cliente

## Flujo de Datos en Producción

### 1. Usuario abre `/aapl`:
```
Cliente → fetch('/api/massive/reference/options?symbol=AAPL')
```

### 2. Servidor (Next.js API Route):
```typescript
// app/api/massive/reference/options/route.ts
const apiKey = process.env.MASSIVE_API_KEY; // ✅ Disponible en servidor
const result = await massive.callRest(path, params);
```

### 3. Massive API:
```
Servidor → fetch('https://api.massive.com/v3/reference/options/contracts', {
  headers: { Authorization: `Bearer ${apiKey}` }
})
```

### 4. Respuesta:
```
Massive API → Servidor → Cliente → UI muestra contratos
```

## Variables de Entorno Necesarias

### En el Servidor (Server-side):
```env
MASSIVE_API_KEY=tu_api_key_aqui
```
- ✅ Solo disponible en el servidor
- ✅ No se expone al cliente
- ✅ Seguro

### En el Cliente (Client-side):
```env
NEXT_PUBLIC_USE_MASSIVE=true
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
- ⚠️ Disponible en el navegador (público)
- ⚠️ Solo flags de configuración, NO datos sensibles

## Verificación Post-Deploy

Después de desplegar, verifica:

1. **Logs del servidor:**
   - Deberías ver: "✅ Got X contracts from reference endpoint"
   - NO deberías ver: "MASSIVE_API_KEY not configured"

2. **Consola del navegador:**
   - Deberías ver: "📊 Fetching options from reference endpoint..."
   - NO deberías ver errores 500

3. **Network tab:**
   - `/api/massive/reference/options?symbol=AAPL` → 200 OK
   - Respuesta con datos de contratos

## ¿Cuándo SÍ necesitarías WebSocket?

Solo si quisieras:
- Actualizaciones en tiempo real instantáneas (sin esperar 30 segundos)
- Streaming de datos continuo
- Notificaciones push del servidor

**Para tu caso:** El polling cada 30 segundos es perfecto y no requiere WebSocket.

## Resumen

✅ **Push a GitHub**: Solo código, sin variables de entorno
✅ **Producción**: Funciona igual que local, solo configura variables
✅ **WebSocket**: NO necesario, HTTP funciona perfecto
✅ **Auto-refresh**: Cada 30 segundos con `setInterval`
✅ **Seguridad**: API key solo en servidor, nunca expuesta al cliente

