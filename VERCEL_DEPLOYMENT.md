# Vercel Deployment - Configuración de Variables de Entorno

## Variables de Entorno Requeridas en Vercel

Para que la aplicación funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno:

### 1. Supabase Variables

1. Ve a tu proyecto en Vercel Dashboard
2. Click en **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 2. Massive API Variables

```
MASSIVE_API_KEY=tu_api_key_de_massive
NEXT_PUBLIC_USE_MASSIVE=true
```

**Importante:**
- `MASSIVE_API_KEY` es **server-side only** (no se expone al cliente)
- `NEXT_PUBLIC_USE_MASSIVE` es **client-side** (disponible en el navegador)

### 3. Cómo Agregar Variables en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto `volatility-signals-agent`
3. Click en **Settings** (Configuración)
4. Click en **Environment Variables** (Variables de Entorno)
5. Agrega cada variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Tu URL de Supabase (ej: `https://xxxxx.supabase.co`)
   - Selecciona los ambientes: Production, Preview, Development
   - Click en **Save**
6. Repite para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Después de Agregar Variables

1. Ve a **Deployments**
2. Click en los tres puntos (⋯) del último deployment
3. Click en **Redeploy**
4. Esto creará un nuevo deployment con las variables de entorno

## Cambios Realizados para Vercel

1. ✅ **Páginas marcadas como dinámicas**: Agregado `export const dynamic = 'force-dynamic'` a:
   - `/login`
   - `/signup`
   - `/` (dashboard)

2. ✅ **API routes marcadas como dinámicas**: Agregado `export const dynamic = 'force-dynamic'` a:
   - `/api/etrade/auth`
   - `/api/etrade/market`
   - `/api/etrade/options`
   - `/api/etrade/iv`

3. ✅ **Cliente de Supabase seguro**: Ahora usa valores placeholder durante el build si no hay variables de entorno

## Notas Importantes

- Las variables de entorno deben tener el prefijo `NEXT_PUBLIC_` para estar disponibles en el cliente
- Después de agregar variables, necesitas hacer un **Redeploy** para que surtan efecto
- El build debería pasar ahora, pero la aplicación no funcionará hasta que agregues las variables de Supabase


