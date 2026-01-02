# Git Configuration - Quick Setup

## Configure Your Git Identity

Before making your first commit, you need to tell Git who you are.

### Run these commands in your terminal:

```bash
# Set your name (replace with your actual name)
git config --global user.name "Javi Gil"

# Set your email (replace with your GitHub email)
git config --global user.email "your.email@example.com"
```

### Or configure only for this repository (without --global):

```bash
git config user.name "Javi Gil"
git config user.email "your.email@example.com"
```

## After Configuration

Once configured, you can make your first commit:

```bash
git commit -m "Initial commit: Volatility Signals Agent with TRADION branding"
```

Then follow the instructions in `GITHUB_SETUP.md` to connect to GitHub.


