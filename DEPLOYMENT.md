# Cloud Deployment Guide (Vercel)

Since `git` is not installed or recognized on your system, we need to do this step-by-step.

## Phase 1: Install Git & Prepare Repository

1.  **Install Git**:
    *   Download and install Git from [git-scm.com](https://git-scm.com/downloads).
    *   During installation, make sure to select "Git from the command line and also from 3rd-party software".
    *   **Restart your terminal/VS Code** after installation.

2.  **Configure Identity** (Required):
    *   Git needs to know who you are to create commits. Run these commands in your terminal (replace with your details):
        ```bash
        git config --global user.name "Your Name"
        git config --global user.email "you@example.com"
        ```

3.  **Initialize Repository**:
    *   Open your terminal in the project folder (`c:\Users\srira\inventory`).
    *   Run these commands:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        ```

4.  **Push to GitHub**:
    *   Create a new repository on [GitHub](https://github.com/new).
    *   Copy the commands shown under "…or push an existing repository from the command line".
    *   Run them in your terminal. They will look like:
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
        git branch -M main
        git push -u origin main
        ```

## Phase 2: Cloud Database (Neon.tech)

Since your local database is on your PC, Vercel cannot access it. We need a cloud database.

1.  Go to [Neon.tech](https://neon.tech) and sign up.
2.  Create a new project.
3.  Copy the **Connection String** (it looks like `postgres://user:password@...`).
4.  **Important**: You need to apply your database schema to this new cloud database.
    *   In your local terminal, run:
        ```bash
        # Replace the URL with your NEON connection string
        npx prisma db push --db-url="postgres://..."
        ```

## Phase 3: Deploy to Vercel

1.  Go to [Vercel](https://vercel.com) and sign up/login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Environment Variables** (Expand the section):
        *   `DATABASE_URL`: Paste your Neon connection string.
        *   `NEXTAUTH_SECRET`: Generate a random string (or use `openssl rand -base64 32` if you have it, otherwise just mash keys for now or use an online generator).
        *   `NEXTAUTH_URL`: You can leave this empty for now, Vercel sets it automatically, but for production, you should set it to your Vercel domain (e.g., `https://inventory-app.vercel.app`) once you know it.
5.  Click **Deploy**.

## Phase 4: Finalize

1.  Once deployed, Vercel will give you a URL.
2.  Go to your **Neon Dashboard** -> **Settings** -> **Compute** and ensure it allows connections from anywhere (usually default).
3.  Test your app!
