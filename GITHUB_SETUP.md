# GitHub Setup Instructions

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `volatility-signals-agent` (or your preferred name)
   - **Description**: "AI-Driven Volatility Context Signals - TRADION"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Connect Your Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

### Option A: If you haven't created the repository yet (recommended)

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/volatility-signals-agent.git

# Rename branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

### Option B: If you already created the repository with files

```bash
# Add the remote
git remote add origin https://github.com/YOUR_USERNAME/volatility-signals-agent.git

# Rename branch to main
git branch -M main

# Pull first (if repository has files)
git pull origin main --allow-unrelated-histories

# Then push
git push -u origin main
```

## Step 3: Verify Connection

After pushing, you should see your code on GitHub. You can verify by:

```bash
git remote -v
```

This should show your GitHub repository URL.

## Important Notes

- **Never commit `.env.local`** - It's already in `.gitignore`
- **Never commit Supabase keys** - Keep them secure
- The `.env.local` file will stay local and won't be pushed to GitHub

## Future Updates

After making changes to your code:

```bash
# Check what changed
git status

# Add changes
git add .

# Commit with a message
git commit -m "Description of your changes"

# Push to GitHub
git push
```

## Using SSH (Optional - More Secure)

If you prefer SSH instead of HTTPS:

1. Generate SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add SSH key to GitHub:
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste your key

3. Use SSH URL instead:
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/volatility-signals-agent.git
   ```

