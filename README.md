# Calcite Footwear — Online Shoe Store

A lightweight, sporty, mobile-first online shoe store built with **React + Vite + TypeScript + Tailwind CSS**, backed by **Supabase (Free Plan)** and hosted for free on **GitHub Pages**.

---

## Architecture Overview

- **Frontend (Static SPA)**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router.
- **Colour System (Calcite Theme)**:
  - Calcite Grey `#DDDCDB` (backgrounds & neutral canvas)
  - Sporty Orange `#FD7B41` (primary buttons & active highlights)
  - Warm Beige `#EDBF9B` (secondary accents & promotional panels)
  - Dark Charcoal `#3C4044` (navigation, text, dark footer & admin sidebar)
- **Backend & Database (Supabase Free Plan)**:
  - PostgreSQL tables: `categories`, `products`, `product_sizes`, `orders`, `order_items`, `store_settings`, `admin_profiles`
  - Atomic PostgreSQL RPC (`place_store_order`) validates live stock and records orders before launching WhatsApp
  - Strict Row Level Security (RLS) protecting customer order data and restricting writes to authorized admins
  - Supabase Storage (`product-images` bucket) with automatic browser-side WebP compression before upload
- **Checkout**: WhatsApp Click-to-Chat (`https://wa.me/...`) with configurable country code, business number, formatted itemized message, explicit send instructions, and copy-paste fallback.
- **Hosting**: GitHub Pages via `.github/workflows/deploy.yml` and `public/404.html` SPA routing redirect.

---

## Project Structure

```text
.github/workflows/deploy.yml   # Automated GitHub Pages build & deployment
public/404.html                # GitHub Pages SPA route handler (/admin, /shop, /product/:slug)
supabase/migrations/
  001_initial_schema.sql       # Tables, constraints, indexes, and place_store_order RPC
  002_rls_and_storage.sql      # Strict RLS policies, is_admin() check, product-images bucket
  003_seed_data.sql            # Starter categories and default store settings
src/
  admin/                       # Protected /admin dashboard (Overview, Products, Inventory, Offers, Orders, Settings)
  assets/                      # Studio footwear imagery
  components/                  # Navbar, Footer, ProductCard, CartDrawer, ResilientImage
  hooks/                       # useStoreData, useCart (localStorage persistence), useAuth
  layouts/                     # StoreLayout
  pages/                       # HomePage, ShopPage, ProductDetailsPage, CheckoutPage
  services/                    # supabaseClient, storeService, whatsappService, seedData
  types/                       # TypeScript domain interfaces
  utils/                       # formatters, imageOptimizer (Canvas WebP compression)
```

---

## Free-Tier Limits & Important Notes

1. **GitHub Pages (Free)**:
   - Public repositories receive free static hosting (`1 GB` recommended site size, `100 GB/month` soft bandwidth limit).
2. **Supabase Free Plan**:
   - `500 MB` PostgreSQL database space, `1 GB` file storage, `5 GB` cached/uncached egress per month, `50,000` Monthly Active Users.
   - Uploaded product photos are automatically resized (max `1200px`) and compressed to WebP in the browser before upload to conserve storage and egress.
   - Inactive free-tier Supabase projects pause after 7 days of zero traffic and wake back up from the Supabase Dashboard.
3. **WhatsApp Checkout Behavior**:
   - WhatsApp Click-to-Chat opens WhatsApp with a pre-filled order message; the customer must tap **Send** inside WhatsApp.
   - Orders are saved in Supabase with status `pending` when submitted on the site, and an admin updates status to `confirmed` after verifying the message in WhatsApp.

---

## Complete Beginner-Friendly Deployment Guide

### 1. Create a Free GitHub Account (If Needed)
1. Go to [https://github.com](https://github.com) and click **Sign up**.
2. Verify your email address and finish creating your free account.

### 2. Create a GitHub Repository
1. Click **+** (top right) -> **New repository**.
2. Name it e.g. `calcite-footwear-store`.
3. Choose **Public** (required for free GitHub Pages on a free GitHub plan) and click **Create repository**.

### 3. Upload the Source Code
Run these commands inside the project folder on your computer:

```bash
git init
git add .
git commit -m "Initial Calcite Footwear online store"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/calcite-footwear-store.git
git push -u origin main
```

### 4. Install Dependencies Locally (To Test on Your Machine)
Ensure [Node.js 20+](https://nodejs.org) is installed, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### 5. Create a Free Supabase Account
1. Visit [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign in with your GitHub account.

### 6. Create the Supabase Project
1. Click **New project**.
2. Select your organization, enter a project name (e.g. `calcite-footwear`), generate a strong database password, pick the region closest to your customers, and choose the **Free** plan.
3. Wait ~1–2 minutes for provisioning.

### 7. Create Database Tables
1. In your Supabase project sidebar, open **SQL Editor** -> **New query**.
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`, paste it into the editor, and click **Run**.

### 8. Apply RLS Policies & Storage Bucket
1. Open another **New query** in **SQL Editor**.
2. Copy the entire contents of `supabase/migrations/002_rls_and_storage.sql`, paste it, and click **Run**.
3. Open a third **New query**, paste `supabase/migrations/003_seed_data.sql`, and click **Run** to insert starter categories and default store settings.

### 9. Verify Storage Configuration
1. Go to **Storage** in the Supabase sidebar.
2. Confirm the `product-images` bucket exists and is marked **Public** (read-only public access; uploads are restricted to authenticated admins via RLS).

### 10. Create Your First Administrator Securely
Never store passwords in frontend code. Create your admin user directly in Supabase:
1. Go to **Authentication** -> **Users** -> **Add user** -> **Create new user**.
2. Enter your admin email (e.g. `owner@yourstore.com`) and a strong password, and check **Auto Confirm User**.
3. Copy the newly created **User UID** from the users table.
4. Go to **SQL Editor** -> **New query** and run:

```sql
insert into public.admin_profiles (user_id, email, full_name, role, is_active)
values (
  'PASTE_USER_UID_HERE',
  'owner@yourstore.com',
  'Store Owner',
  'super_admin',
  true
);
```

### 11. Configure Environment Variables
1. In Supabase, go to **Project Settings** -> **API**.
2. Copy your **Project URL** (`https://xxxx.supabase.co`) and **anon public** key (never copy the `service_role` key!).
3. For **local development**, copy `.env.example` to `.env` and fill in your values:

```env
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
VITE_BASE_PATH="/"
```

4. For **GitHub Pages deployment**, add those two values as repository secrets in GitHub:
   - Go to your GitHub repo -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

### 12. Verify GitHub Actions Configuration
The included workflow file `.github/workflows/deploy.yml` automatically:
- Runs `npm ci`
- Injects `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_BASE_PATH="/<repo-name>/"`
- Builds `./dist` via `npm run build`
- Deploys `./dist` to GitHub Pages whenever you push to `main`.

### 13. Enable GitHub Pages
1. In your GitHub repository, open **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, choose **GitHub Actions**.

### 14. Deploy the Website
Trigger a push (or run the workflow manually under the **Actions** tab -> **Deploy Calcite Footwear to GitHub Pages** -> **Run workflow**):

```bash
git push origin main
```

Once the workflow turns green (~1 minute), your live store URL will be shown in the workflow summary (typically `https://YOUR_USERNAME.github.io/calcite-footwear-store/`).

### 15. Access the Admin Dashboard
1. Visit `https://YOUR_USERNAME.github.io/calcite-footwear-store/admin` (or click **Store Admin Dashboard** in the website footer).
2. Sign in with the email and password you created in Step 10.
3. Immediately configure your **Business WhatsApp Number**, **Store Name**, and **Delivery Charges** under **Store Settings**, then add your shoes and UK size stock counts.

### 16. Update the Website Later
Whenever you make code updates locally:

```bash
git add .
git commit -m "Describe your update"
git push origin main
```

GitHub Actions will rebuild and redeploy your site automatically. Product prices, images, discounts, and stock changes made inside `/admin` update live in Supabase without needing to redeploy code.
