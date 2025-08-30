# Key Path Trainer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

A comprehensive keyboard training application built with React, TypeScript, and modern web technologies. Master touch typing through adaptive training, real-time statistics, and personalized learning paths.

## 📋 Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [Deployment](#deployment)
- [License](#license)
- [Support](#support)

## ✨ Features

- **🎯 Adaptive Training**: Personalized lessons that adjust to your skill level
- **📊 Real-time Statistics**: Track your progress with detailed analytics and visualizations
- **⌨️ Keyboard Emulation**: Practice with different keyboard layouts (QWERTY, Colemak, etc.)
- **🎯 Focus Mode**: Distraction-free training environment
- **🌍 Multi-language Support**: Available in English and Indonesian
- **📈 Progress Tracking**: Comprehensive dashboard with WPM, accuracy, and mistake analysis
- **⚙️ Admin Panel**: Curriculum management and data migration tools
- **🎨 Modern UI**: Built with shadcn/ui and Tailwind CSS for a beautiful, responsive interface

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### UI & Styling
- **shadcn/ui** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions

### State Management & Data
- **React Context** - State management
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Internationalization & Utils
- **i18next** - Internationalization framework
- **Recharts** - Data visualization
- **date-fns** - Date utilities

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **bun** package manager
- **Git** - [Download here](https://git-scm.com/)

You can verify your Node.js installation by running:
```bash
node --version
npm --version
```

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/wongpinter/key-path-trainer.git
   cd key-path-trainer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or if using bun
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. **Open your browser:**
   
   Navigate to [http://localhost:5173](http://localhost:5173) to see the application running.

## 💡 Usage

### Basic Training
1. Sign up or log in to your account
2. Choose a training lesson from the curriculum
3. Start typing in the training area
4. Monitor your progress in real-time
5. Review your statistics after each session

### Advanced Features
- **Focus Mode**: Toggle focus mode for distraction-free training
- **Keyboard Emulation**: Switch between different keyboard layouts
- **Statistics Dashboard**: View detailed analytics of your typing progress
- **Admin Panel**: Manage curriculum and migrate data (admin access required)

## 📁 Project Structure

```
key-path-trainer/
├── public/                 # Static assets
│   ├── locales/           # Translation files
│   └── favicon.ico
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components (shadcn/ui)
│   │   ├── training/     # Training-related components
│   │   ├── statistics/   # Statistics and analytics
│   │   ├── auth/         # Authentication components
│   │   ├── admin/        # Admin panel components
│   │   └── analytics/    # Analytics components
│   ├── contexts/         # React contexts for state management
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services and utilities
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── i18n/             # Internationalization configuration
│   ├── data/             # Static data and configurations
│   ├── pages/            # Page components
│   └── integrations/     # External service integrations
├── supabase/              # Supabase configuration and migrations
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── README.md            # Project documentation
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build the project for production |
| `npm run build:dev` | Build the project for development |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository** on GitHub
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and ensure they follow our coding standards
4. **Test your changes** thoroughly
5. **Commit your changes:**
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```
6. **Push to your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** with a clear description of your changes

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 🚀 Deployment

The application is configured for deployment on Netlify:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Connect your GitHub repository to Netlify
   - Set the build command to `npm run build`
   - Set the publish directory to `dist`
   - Configure environment variables in Netlify dashboard

The application will be automatically deployed on every push to the main branch.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions, issues, or need help:

- **📧 Email**: Contact the development team
- **🐛 Issues**: Open an issue on [GitHub](https://github.com/wongpinter/key-path-trainer/issues)
- **💬 Discussions**: Join the discussions on [GitHub](https://github.com/wongpinter/key-path-trainer/discussions)

---

**Happy typing! 🎯⌨️**
