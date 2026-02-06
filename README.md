# Finca Vergel / Sonora Coffee Replica

This is a modern web application built with **React**, **Vite**, and **Supabase**, designed as a digital presence for a coffee farm. It replicates the aesthetic of *sonoracoffee.com* while adding a robust Content Management System (CMS) for dynamic updates.

## 🚀 Tech Stack

-   **Frontend:** React 18, Vite, React Router DOM
-   **Styling:** CSS3, Flexbox/Grid (Responsive Design)
-   **Backend / Database:** Supabase (PostgreSQL, Auth, Storage)
-   **Deployment:** Vercel (SPA configuration)

## 🛠️ Features

-   **Dynamic Content:** All text and images (galleries, logos, backgrounds) are manageable via the Admin Dashboard.
-   **Responsive Design:** Fully optimized for Mobile, Tablet, and Desktop.
-   **Image Carousel:** Custom built image sliders with touch support.
-   **Admin Panel:** Protected route (`/admin`) for content updates without code changes.
-   **Supabase Integration:** Real-time data fetching and secure image storage.

## ⚙️ Setup & Installation

### 1. Prerequisites

-   Node.js (v18+ recommended)
-   npm or yarn

### 2. Clone the Repository

```bash
git clone https://github.com/anbepa/fincaVergel.git
cd fincaVergel
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Variables

Create a `.env` file in the root directory (do not commit this file). You need the project credentials from Supabase:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Development Server

```bash
npm run dev
```

The application will run at `http://localhost:5173`.

## 📦 Deployment on Vercel

This project is configured for Vercel.

1.  Push your code to GitHub.
2.  Import the repository in Vercel.
3.  Vercel should automatically detect **Vite**.
4.  **Crucial:** Add the Environment Variables in the Vercel Dashboard (Settings > Environment Variables):
    -   `VITE_SUPABASE_URL`
    -   `VITE_SUPABASE_ANON_KEY`
5.  Deploy!

## ⚠️ Important Notes

-   **Images Ignored:** Large image files (`.png`, `.jpg`, etc.) are **excluded** from this repository via `.gitignore` to keep the repo light.
-   **Static Assets:** Ensure essential static assets are managed via Supabase Storage or placed in the `public` folder if strictly necessary for the build (though local images are ignored by default).
-   **Supabase Setup:** The database schema is required. See `supabase_setup.sql` for the SQL commands to create the `content_pages` table and `page-images` bucket.

## 🔒 Admin Access

Navigate to `/admin` to log in.
*Note: Authentication logic handles session access via Supabase Auth.*
