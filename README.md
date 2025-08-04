# ♟️ Real-Time Multiplayer Chess Web Application

[![Netlify Status](https://img.shields.io/badge/Live-Demo-00C7B7?logo=netlify&logoColor=white&style=for-the-badge)](https://sanchitchess.netlify.app/)
[![GitHub](https://img.shields.io/badge/Source-GitHub-181717?logo=github&logoColor=white&style=for-the-badge)](https://github.com/Sanchit1002/CHESS.git)

---

## 🎯 Overview

An immersive and feature-rich **real-time multiplayer chess platform** built using modern web technologies.  
This app blends a sleek UI, robust chess logic, and real-time data syncing to deliver a scalable and interactive experience across devices.

---

## 🌟 Why This Project?

This project was designed to explore and demonstrate:

- ⚡ **Real-time synchronization** using Firebase Firestore  
- 🎮 **Multiplayer mechanics** powered by `chess.js`  
- 🧱 **Scalable architecture** and responsive design  
- 💡 **User-centric design** with interactive elements like chat, leaderboard, and theming  

> Developing this chess app challenged every layer—from real-time logic to UI/UX—resulting in a modern, polished solution.

---

## ✨ Features at a Glance

- ✅ **Real-Time Multiplayer** – Play live chess matches with smooth game state updates
- 📊 **Dynamic Leaderboard** – Track ratings, wins/losses, and match stats
- 👥 **Friends System** – Add friends, check online status, and invite them
- 💬 **In-Game Chat** – Chat with opponents while playing
- 📜 **Game History** – Review past games and detailed stats
- 🎨 **Customizable Boards** – Multiple board and piece themes
- 📱 **Fully Responsive** – Works seamlessly across all screen sizes
- 🔐 **Secure Auth** – Firebase email/password authentication
- ⚙️ **.env Security** – All environment variables secured properly

---

## 🛠️ Tech Stack

### 📦 Tech Stack (Tabular View)

| **Layer**     | **Technologies**                                |
|---------------|-------------------------------------------------|
| **Frontend**  | React.js, TypeScript, Tailwind CSS, Chess.js    |
| **Backend**   | Firebase Firestore, Firebase SDK (Serverless)   |
| **Database**  | Firebase Firestore (NoSQL, Real-Time)           |
| **Deployment**| Netlify                                         |

### 🔧 Tech Stack (Badges View)

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)
![Chess.js](https://img.shields.io/badge/Logic-Chess.js-000000?style=for-the-badge)

![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?logo=firebase&logoColor=black&style=for-the-badge)
![Firestore](https://img.shields.io/badge/Database-Firestore-FFA000?logo=firebase&logoColor=white&style=for-the-badge)

![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white&style=for-the-badge)

---

## 💻 Getting Started

### 🔗 Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Firebase Project with Firestore enabled

---

### 🚀 Local Setup

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Sanchit1002/CHESS.git
cd CHESS

#### 2️⃣ Install Dependencies
```bash
npm install

### 🔐 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

## 🖥️ 4️⃣ Start the Development Server

```bash
npm run dev
```

Your app will be running locally at:  
👉 [http://localhost:5173](http://localhost:5173)

---

## 🌍 Live Demo

You can try the deployed version here:  
👉 [https://sanchitchess.netlify.app](https://sanchitchess.netlify.app)

---

## 📁 Folder Structure (Simplified)

```bash
CHESS/
├── public/            # Static files
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/         # Page-level components
│   ├── utils/         # Utility functions and helpers
│   ├── assets/        # Images, icons, etc.
│   └── firebase.ts    # Firebase configuration
├── .env               # Environment variables (not committed)
├── package.json
└── vite.config.ts     # Vite configuration
```

---

## 📄 License

This project is licensed under the **MIT License**.
