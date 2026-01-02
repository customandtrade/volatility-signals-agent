# Supabase Database Setup - Profiles Table

## Estado Actual

### Tablas Existentes (Automáticas):
- ✅ **`auth.users`** - Tabla automática de Supabase que guarda:
  - Email
  - Password (hasheado)
  - `user_metadata` (donde se guardan temporalmente first_name, last_name, username)

### Lo que Falta:
- ❌ **`profiles`** - Tabla para guardar información adicional del usuario de forma permanente

## Cómo Crear la Tabla de Perfiles

### Opción 1: Usando el SQL Editor de Supabase (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega el contenido del archivo `supabase/migrations/001_create_profiles_table.sql`
5. Click en **Run** (o presiona Ctrl+Enter)
6. Deberías ver "Success. No rows returned"

### Opción 2: Ejecutar el SQL Directamente

Ve a: **Supabase Dashboard → SQL Editor → New Query**

Y ejecuta este SQL:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      LOWER(REGEXP_REPLACE(NEW.raw_user_meta_data->>'first_name', '[^a-zA-Z0-9]', '', 'g')) || 
      FLOOR(RANDOM() * 10000)::TEXT
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## ¿Qué Hace Este Script?

1. **Crea la tabla `profiles`** con:
   - `id` - Referencia al usuario (UUID)
   - `first_name` - Nombre del usuario
   - `last_name` - Apellido del usuario
   - `username` - Nombre de usuario único
   - `created_at` y `updated_at` - Timestamps automáticos

2. **Habilita Row Level Security (RLS)** - Los usuarios solo pueden ver/editar su propio perfil

3. **Crea políticas de seguridad** - Permite que los usuarios:
   - Vean su propio perfil
   - Inserten su propio perfil
   - Actualicen su propio perfil

4. **Crea un trigger automático** - Cuando un usuario se registra:
   - Automáticamente crea un registro en la tabla `profiles`
   - Copia los datos de `user_metadata` a la tabla `profiles`
   - Genera un username automáticamente si no se proporcionó uno

## Verificar que Funcionó

Después de ejecutar el SQL:

1. Ve a **Table Editor** en Supabase
2. Deberías ver la tabla `profiles` en la lista
3. Cuando un usuario se registre, automáticamente se creará un perfil

## Estado del Login y Signup

### ✅ Signup (Registro):
- Funciona correctamente
- Guarda email y password en `auth.users`
- Guarda first_name, last_name, username en `user_metadata`
- Con el trigger, también creará automáticamente un perfil en la tabla `profiles`

### ✅ Login (Inicio de Sesión):
- Funciona correctamente
- Autentica con email y password
- Redirige al dashboard después del login exitoso

## Próximos Pasos (Opcional)

Si quieres leer los datos del perfil después del login, puedes hacerlo así:

```typescript
// Obtener perfil del usuario
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```


