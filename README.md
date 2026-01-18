# AWS SAA-C03 Quiz Application

A modern, interactive quiz application for AWS Solutions Architect Associate (SAA-C03) certification practice. Built with React, TypeScript, Vite, and Supabase.

## ✨ Features

- 📚 **1000+ Practice Questions** - Comprehensive question bank from SAA-C03
- 🤖 **AI-Powered Explanations** - Get detailed explanations using Google Gemini AI
- 📖 **Theory Mode** - Understand the concepts behind each question
- 🌐 **Bilingual Support** - Vietnamese and English interface
- 💾 **Progress Tracking** - Answers saved locally in your browser
- 🎨 **Modern UI/UX** - Beautiful, responsive design with smooth animations
- ☁️ **Cloud Database** - Supabase for AI cache storage

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Database**: Supabase
- **AI**: Google Gemini 1.5 Flash
- **Deployment**: Vercel

## 📋 Prerequisites

Before you begin, you'll need:

1. **Supabase Account** - [Sign up here](https://supabase.com)
2. **Google Gemini API Key** - [Get one here](https://makersuite.google.com/app/apikey)
3. **Node.js** - Version 18 or higher

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/vinhnguyenthanhdn/aws-ssa-c03.git
cd aws-ssa-c03
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase Database

#### Create a new Supabase project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details

#### Create Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create user_answers table
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_cache table
CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id TEXT NOT NULL,
  language TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('explanation', 'theory')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, language, type)
);

-- Create indexes for better performance
CREATE INDEX idx_user_answers_question ON user_answers(question_id);
CREATE INDEX idx_ai_cache_lookup ON ai_cache(question_id, language, type);
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key
```

**Where to find these values:**

- **Supabase URL & Key**: Go to Project Settings → API in your Supabase dashboard
- **Gemini API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 🌐 Deploy to Vercel

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
5. Click "Deploy"

### Environment Variables on Vercel

Add these in Vercel Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## 📁 Project Structure

```
aws-ssa-c03/
├── public/
│   └── SAA_C03.md          # Questions database
├── src/
│   ├── components/         # React components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── AIContent.tsx
│   │   ├── Navigation.tsx
│   │   └── Loading.tsx
│   ├── lib/               # Core libraries
│   │   ├── supabase.ts    # Supabase client
│   │   ├── ai-service.ts  # AI API integration
│   │   ├── parser.ts      # Markdown parser
│   │   └── translations.ts # i18n support
│   ├── styles/            # CSS modules
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── streamlit-archive/     # Original Streamlit code
├── vercel.json            # Vercel config
└── package.json
```

## 🎯 Features Roadmap

- [ ] User authentication
- [ ] Study progress analytics
- [ ] Bookmark questions
- [ ] Random quiz mode
- [ ] Timed practice exams
- [ ] Flashcard mode
- [ ] Social sharing

## 🐛 Troubleshooting

### Questions not loading

- Check if `SAA_C03.md` exists in the `public/` folder
- Check browser console for errors

### AI not working

- Verify `VITE_GEMINI_API_KEY` is set correctly
- Check if you have API quota remaining
- Check browser console for API errors

### Database errors

- Verify Supabase tables are created correctly
- Check if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Ensure Row Level Security (RLS) policies allow anonymous access if needed

## 📝 License

ISC

## 👤 Author

Vinh Nguyen

## 🙏 Acknowledgments

- AWS for the certification program
- Supabase for the amazing backend platform
- Google for the Gemini AI API
- ExamTopics for question inspiration
