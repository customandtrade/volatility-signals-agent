# GitHub Authentication - Solución de Error 403

## Problema
Git está usando credenciales de otro usuario (`infomillionshustle-lang`) en lugar de las tuyas.

## Solución Recomendada: Personal Access Token

### Paso 1: Crear un Personal Access Token
1. Ve a GitHub.com → Tu perfil → **Settings**
2. En el menú izquierdo, ve a **Developer settings**
3. Click en **Personal access tokens** → **Tokens (classic)**
4. Click en **Generate new token (classic)**
5. Dale un nombre (ej: "volatility-signals-agent")
6. Selecciona el scope: **repo** (marca todo lo relacionado con repos)
7. Click en **Generate token**
8. **¡IMPORTANTE!** Copia el token inmediatamente (solo se muestra una vez)

### Paso 2: Usar el Token para hacer Push

Ahora intenta hacer push de nuevo:

```bash
git push -u origin main
```

Cuando te pida credenciales:
- **Username**: `customandtrade` (o tu usuario de GitHub)
- **Password**: Pega el **Personal Access Token** (no tu contraseña normal)

## Alternativa: Usar SSH

Si prefieres usar SSH (más seguro a largo plazo):

1. Genera una clave SSH:
   ```bash
   ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
   ```

2. Copia tu clave pública:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

3. Agrega la clave a GitHub:
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - Pega tu clave pública

4. Cambia el remote a SSH:
   ```bash
   git remote set-url origin git@github.com:customandtrade/volatility-signals-agent.git
   ```

5. Intenta push de nuevo:
   ```bash
   git push -u origin main
   ```

## Verificar que Funcionó

Después del push exitoso, ve a:
https://github.com/customandtrade/volatility-signals-agent

Deberías ver todos tus archivos allí.

