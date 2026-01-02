# Cómo hacer Push a GitHub - Instrucciones

## Método 1: Usar Personal Access Token (Recomendado)

### Paso 1: Crear el Token
1. Ve a: https://github.com/settings/tokens
2. Click en **"Generate new token (classic)"**
3. Nombre: "volatility-signals-agent"
4. Selecciona: **repo** (marca todas las opciones de repo)
5. Click en **"Generate token"**
6. **COPIA EL TOKEN** (solo se muestra una vez)

### Paso 2: Hacer Push con el Token

Ejecuta este comando en tu terminal (reemplaza `TU_TOKEN` con el token que copiaste):

```bash
git push https://TU_TOKEN@github.com/customandtrade/volatility-signals-agent.git main
```

O actualiza el remote con el token:

```bash
git remote set-url origin https://TU_TOKEN@github.com/customandtrade/volatility-signals-agent.git
git push -u origin main
```

## Método 2: Usar SSH (Más Seguro a Largo Plazo)

### Paso 1: Generar Clave SSH
```bash
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
```
(Presiona Enter para usar la ubicación por defecto, y Enter de nuevo para no usar contraseña)

### Paso 2: Copiar Clave Pública
```bash
cat ~/.ssh/id_ed25519.pub
```
Copia todo el contenido que aparece

### Paso 3: Agregar Clave a GitHub
1. Ve a: https://github.com/settings/ssh/new
2. Title: "Mi Laptop" (o el nombre que quieras)
3. Key: Pega la clave que copiaste
4. Click en **"Add SSH key"**

### Paso 4: Cambiar Remote a SSH
```bash
git remote set-url origin git@github.com:customandtrade/volatility-signals-agent.git
git push -u origin main
```

## Método 3: Usar GitHub CLI (gh)

Si tienes GitHub CLI instalado:
```bash
gh auth login
gh repo set-default customandtrade/volatility-signals-agent
git push -u origin main
```

## Verificar que Funcionó

Después de un push exitoso, ve a:
https://github.com/customandtrade/volatility-signals-agent

Deberías ver todos tus archivos allí.


