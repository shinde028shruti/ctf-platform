# CTF Platform — Documentation

This document describes every section of the CTF platform: how the app is structured, what each page contains, and what the different roles can do.

---

## 1. Overview

A full-featured Capture The Flag (CTF) competition platform built as a **React single-page application** (React 18 + Vite) with:

- **React Router v6** for navigation and route protection
- **Bootstrap 5** grid/utilities for layout
- **lucide-react** for icons
- **framer-motion** for animations
- **three / @react-three/fiber / @react-three/drei** for the 3D hero scene
- **CSS variables** (single dark theme defined in `src/styles/global.css`)

**Route structure** (`src/App.jsx`):

| Route | Page | Layout |
|---|---|---|
| `/` | Landing | Public (no sidebar) |
| `/about` | About | Public (no sidebar) |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/onboarding` | Onboarding | Onboarding |
| `/dashboard` | Dashboard | User panel (sidebar) |
| `/challenges` | Challenges | User panel (sidebar) |
| `/challenges/:id` | Challenge Details | User panel (sidebar) |
| `/leaderboard` | Leaderboard | User panel (sidebar) |
| `/achievements` | Achievements | User panel (sidebar) |
| `/events` | Events | User panel (sidebar) |
| `/profile` | Profile | User panel (sidebar) |
| `/settings` | Settings | User panel (sidebar) |
| `/admin` | Admin Dashboard | Admin panel |
| `/admin/challenges` | Manage Challenges | Admin panel |
| `/admin/challenges/new` | Create Challenge | Admin panel |
| `/admin/challenges/:id/edit` | Edit Challenge | Admin panel |
| `/admin/categories` | Manage Categories | Admin panel |
| `/admin/users` | Manage Users | Admin panel |
| `/admin/submissions` | Manage Submissions | Admin panel |
| `/admin/audit-logs` | Audit Logs | Admin panel |
| `/admin/settings` | Admin Settings | Admin panel |
| `/admin/events` | Events (placeholder/scaffolded) | Admin panel |

---

## 2. Access & Roles

### Public visitors (no account / not signed in)
- See the Landing page (`/`) and About page (`/about`).
- Can `/login` or `/register`.

### Student / Competitor (signed-in participants)
- Complete the **onboarding flow** after registering.
- Get the **user panel** (top navbar + left sidebar) with access to Dashboard, Challenges, Leaderboard, Achievements, Events, Profile, and Settings.

### Admin
- Same user-panel experience, **plus** `/admin/*` sections for managing challenges, categories, users, and submissions.
- Admin sidebar is shown through `AdminLayout.jsx` (rendered inside `.admin-panel` wrapper).

### Sign-in types (same entry point)
- **Email & password** — regular registration.
- **Google / GitHub** — OAuth-style buttons on the login/register pages (auto-fills a "social" sign-in route).

---

## 3. Onboarding Flow

After registering, new users are forced into `/onboarding`, a **6-step wizard** with a progress tracker and next/back controls:

1. **Welcome** — intro, username + display name, avatar selection (emoji + generated avatar).
2. **Skill** — experience level radio cards (Beginner, Intermediate, Advanced, Professional).
3. **Team** — create a team, join a team via code, or skip for now.
4. **Focus** — pick focus areas from a responsive grid (`col-12 col-sm-6`): Web Exploitation, Forensics, Binary Exploitation (Pwn), Reverse Engineering, OSINT, Cryptography, Steganography, Networking, Mobile, Misc.
5. **Purpose** — tell why you're here (Learn, Compete, Teach, etc.).
6. **Experience** — things you'd like to explore and how you found the platform.

On completing the final step the user is redirected to the Dashboard.

---

## 4. Public Pages

### 4.1 Landing (`/`)
Marketing / landing page with several sections:

- **Hero** — a **3D animated scene** (`HeroScene`) with rings/sphere particles, headline, CTA buttons (Get Started / View Challenges), and a terminal-style mock output.
- **Stats bar** — typewriter-style rotating stats (participants, challenges, countries, prizes).
- **Student / Competitor selector** — lets a visitor choose their role before continuing (routes to `/register` with the selected role).
- **"What is a CTF?"** — explanation cards.
- **Categories** — grid of challenge categories with icons.
- **Featured challenges** — 3 preview challenge cards.
- **Top hackers** — leaderboard preview (top 5 players with scores).
- **Final CTA** — "Ready to hack?" call to action + footer.

### 4.2 About (`/about`)
- Intro block describing the platform.
- **4 feature cards** (e.g. learn by doing, real-world scenarios, community, etc.).
- **Ready to start** CTA block + footer.

### 4.3 Login / Register
- **Login** (`/login`): email/password form, Google/GitHub buttons, "forgot password" link, link to Register.
- **Register** (`/register`): full name, email, username, password, confirm password, role selection (Student/Competitor), terms checkbox; "Sign in" link if you already have an account.

---

## 5. User Panel (signed-in area)

### 5.1 Top navbar (all user-panel pages)
- **Brand/logo** → links home.
- **Search bar** — universal challenge search (hidden on the landing and about pages).
- **Home** and **About Us** links on the right side.
- **Auth area**: bell/notifications icon, user avatar dropdown (Profile / Settings / Logout), and a **PowerShell console** launcher.

### 5.2 PowerShell console (every page)
A dockable terminal exposed by the navbar button. Provides a simulated PowerShell/shell:

- Input box styled like a terminal prompt (`C:\Users\...>`) with command history.
- Pressing **Enter** runs the command, echoes it to the log, and clears the input.
- Example commands: `help`, `whoami`, `ls`, `dir`, `cat flag.txt`, etc. with mock outputs.
- A "system message" banner effect when opened.

### 5.3 Sidebar (left nav)
- **Dashboard** (LayoutDashboard)
- **Challenges** (Target)
- **Leaderboard** (Trophy)
- **Achievements** (Award)
- — *Account* section —
- **Profile** (User)
- **Settings** (Settings)

### 5.4 Dashboard (`/dashboard`)
- **Welcome hero** — greets the user, "Resume Learning" prompt.
- **Stat cards** — Solved, Rank, Streak, Points.
- **Recommended for you** — challenge cards ("unlocked", point values, categories).
- **Ring gauge** — overall completion progress.
- **Category points** — breakdown per category.
- **Completed challenges** — recent completions list.
- **Terminal status** — docker/lab container status boxes.
- **Recent activity** — feed of latest events (solved challenges, joined events, etc.).

### 5.5 Challenges (`/challenges`)
- Mode toggle: **Attack / Defend**.
- **ChallengeFilter** bar with custom `ThemedSelect` dropdowns (category, difficulty) and a search input.
- **ChallengeCards** grid — each card shows category, title, tags, difficulty/points, and a "View" button.
- Buttons: "Create Challenge" (admin) and responsive cards.

### 5.6 Challenge Details (`/challenges/:id`)
- Challenge metadata (category, points, difficulty, attempts / solo-completion status).
- **Description tab** in a terminal panel.
- **Hints** — expandable HintCards (up to 3 hints).
- **Cheatsheet tab** — quick reference content.
- **Flag submit box** — enter flag, gets "correct"/"incorrect" feedback.
- **Instance spawning** — request/spin-up a container (target type, host, port) for dynamic challenges.
- **Files & downloads** — attachable challenge files.

### 5.7 Leaderboard (`/leaderboard`)
- **Tabs**: Global / Weekly / Country / Category.
- **Podium** — top 3 players with medals and animated positioning; country flag chips.
- **Ranking table** — rows with rank, player, country, points, activities; me/highlight row if present.

### 5.8 Achievements (`/achievements`)
- **Summary** — total badges earned, points, best streak.
- **Badge grid** — unlocked badges; **locked badges** shown with a lock icon and description of how to unlock.

### 5.9 Events (`/events`)
- **Countdown** card to the next event.
- **Event list** — expandable event cards with date, location/online, details, and "Register" action.

### 5.10 Profile (`/profile`)
- **Profile card** — avatar, username, rank, bio, social links.
- **Stats** — solved, points, country rank.
- **Badges** — earned achievement badges.
- **Weekly / Monthly progress** — chart bars.
- **Category performance** — points per category.
- **Activity log** — recent actions.

### 5.11 Settings (`/settings`)
- **Tabs**: Profile, Privacy, Security, Notifications, Danger Zone.
- Edits profile info, privacy toggles, password change, notification preferences, and an **account deletion** section.

---

## 6. Admin Panel

Admin pages live under `/admin` with their own sidebar (`AdminLayout.jsx`) listing:

- **Dashboard**
- **Challenges**
- **Create Challenge**
- **Categories**
- **Users**
- **Submissions**
- **Audit Logs**
- **Settings**
- (Events — commented out / scaffolded)

The admin sidebar shows a bright "Admin Panel" header.

### 6.1 Admin Dashboard (`/admin`)
- **Stat cards** — total users, challenges, submissions, active containers.
- **Charts** — submissions & user growth (bars/lines).
- **Toast invite** examples and **Quick actions** — "Create Challenge", "Manage Users", "View Submissions", "View Audit Logs".

### 6.2 Manage Challenges (`/admin/challenges`)
- **Table** of challenges: category, title, difficulty, points, status (Draft/Published), solves; striped rows.
- **Row actions**: Edit, Preview, Duplicate, Publish/Unpublish toggle, Delete.
- **Filter chips** (All / Published / Draft) + Create Challenge button.

### 6.3 Create / Edit Challenge (`/admin/challenges/new`, `/admin/challenges/:id/edit`)
Multi-tab form:

- **Overview** — title, category, difficulty, points, flag, description (mock editor).
- **Files** — drag-and-drop upload zone (ZIP, TXT, PDF, PNG, JPG, PCAP, PY, C, EXE, APK) with a removable file list (mock).
- **Deployment** — enable a live **Challenge Instance** (target type, target URL/host, port) with a note that Docker/health-check management happens on the backend.
- Sticky action bar: **Save Draft**, **Preview** (shows an alert rather than a real preview), **Publish Challenge** (or Update & Publish when editing), **Cancel**.

### 6.4 Categories (`/admin/categories`)
- **Read-only grid** of existing categories with name, icon, challenge count, "View" action.
- **Add category** form (mock) for new ones.

### 6.5 Users (`/admin/users`)
- **Stats bar** — total users, active today, new this week, banned.
- **Tables** filtered by **role** (All/Admin/Moderator/Player) and **status** (All/Active/Suspended/Banned).
- Row actions: promote/demote role, suspend, delete.

### 6.6 Submissions (`/admin/submissions`)
- **Filter chips** by status (All / Pending / Correct / Incorrect).
- **Table** of submissions: timestamp, user, challenge, flag submitted (masked), status, score.

### 6.7 Audit Logs (`/admin/audit-logs`)
- **Filterable log feed** — actor, action, target.
- Actions colored by **badge style** (login, create, update, delete, publish, etc.).

### 6.8 Admin Settings (`/admin/settings`)
- **Sections with toggle switches / sliders** (e.g. challenge registration, team limits, auto-grading). Values are editable mock controls.
- Save button (feedback).

### 6.9 Placeholder sections
Unfinished/scaffolded admin sections (`/admin/events` etc.) render `AdminPlaceholder` with an "under construction" message.

---

## 7. Styling & Theming

- All colors, fonts, spacing come from **CSS variables** in `src/styles/global.css` (dark theme: `--bg-primary`, `--accent-green`, `--accent-cyan`, `--accent-purple`, `--border-bright`, etc.).
- Reusable class names: `.page-header`, `.card`, `.stat-card`, `.btn-*`, `.themed-select` (custom dropdown styling), `.console-*` (terminal styles), `.section-block`.
- Motion: `framer-motion` fade/slide-in wrappers and keyframe animations (`animate-fade-in`, `spin`, typewriter, `slide-in` for modals).

---

## 8. Notes / Current State

- This is the **front-end build only** — API calls, authentication, Docker instance management, and data persistence are not wired up yet. Most data is mocked (mock users, mock challenges, mock submissions, mock file uploads, mock terminal output).
- The **search bar** and **PowerShell console** are functional UI with mock logic.
- Certain admin actions (Preview, Delete, Publish) currently use browser alerts/demos rather than real back-end calls.