# Supabase Setup Instructions

## What you need to provide:

1. **Supabase Project URL**
   - Format: `https://xxxxx.supabase.co`
   - You can find this in your Supabase project settings

2. **Supabase Anon Key** (Public Key)
   - This is the public/anonymous key from your Supabase project
   - You can find this in: Project Settings → API → Project API keys → `anon` `public`

## Steps to configure:

1. Create a `.env.local` file in the root of the project
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. Replace the values with your actual Supabase credentials
4. Restart your development server (`npm run dev`)

## How to get your Supabase credentials:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon)
4. Click on **API** in the left sidebar
5. You'll see:
   - **Project URL** → Copy this for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → Copy the `anon` `public` key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema (Optional - for user profiles):

If you want to store additional user information (first name, last name, username), you'll need to create a `profiles` table in Supabase:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
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

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## Notes:

- The `.env.local` file is already in `.gitignore`, so your credentials won't be committed to git
- Never share your Supabase keys publicly
- The `anon` key is safe to use in client-side code, but make sure RLS (Row Level Security) is enabled on your tables

