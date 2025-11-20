# Property AI Chatbot

A smart property assistant chatbot built with React, Vite, and Vercel serverless functions. Uses Groq AI for natural language understanding and Google Sheets for property data storage.

## Features

- 🤖 AI-powered intent extraction and natural language understanding
- 📊 Real-time property data queries from Google Sheets
- 💬 Beautiful, responsive chat interface
- 🚀 Serverless deployment on Vercel
- ⚡ Fast responses with intelligent caching

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Groq API key ([Get one here](https://console.groq.com/))
- Google Cloud service account with Sheets API access
- Google Sheet with property data

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd property-ai-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `GROQ_API_KEY` - Your Groq API key
- `GOOGLE_SHEET_ID` - Your Google Sheet ID
- `GOOGLE_CLIENT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Service account private key (with `\n` for newlines)
- `GCLOUD_PROJECT_ID` - Google Cloud project ID

### Local Development

Run with Vercel CLI (recommended):
```bash
npm run dev:vercel
# or
npx vercel dev
```

This starts the full stack at `http://localhost:3000` with both frontend and API functions.

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Deployment to Vercel

### Option 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click "New Project" and import your repository
4. Add environment variables in Vercel Dashboard → Settings → Environment Variables
5. Deploy!

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

Make sure to add all environment variables in the Vercel dashboard.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key | Yes |
| `GROQ_MODEL` | Groq model name (default: `llama-3.1-70b-versatile`) | No |
| `GOOGLE_SHEET_ID` | Google Sheet ID | Yes |
| `GOOGLE_CLIENT_EMAIL` | Service account email | Yes |
| `GOOGLE_PRIVATE_KEY` | Service account private key | Yes |
| `GCLOUD_PROJECT_ID` | Google Cloud project ID | Yes |

## Google Sheets Setup

Your Google Sheet must have:
- Tab name: `Info`
- First row: Column headers
- Subsequent rows: Property data

### Required Columns

- `Unit #` - Property identifier
- `Title on Listing's Site` - Property name
- `Property Owner name` - Owner name
- And any other columns you want to query (see `api/propertyHandler.js` for full mapping)

## Project Structure

```
property-ai-chatbot/
├── api/                    # Vercel serverless functions
│   ├── proxyWebhook.js     # Main API endpoint
│   ├── intentExtractor.js  # Groq-based intent classification
│   ├── fieldTypeResolver.js # Field type mapping
│   ├── propertyHandler.js  # Google Sheets queries
│   └── generalReply.js    # Fallback AI responses
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # React hooks
│   └── utils/             # Utilities
├── public/                # Static assets
└── dist/                  # Build output
```

## API Endpoints

### POST `/api/proxyWebhook`

Main chatbot endpoint.

**Request:**
```json
{
  "message": "What's the WiFi password at Unit 5?"
}
```

**Response:**
```json
{
  "reply": "Here is the Wi-Fi login for **Unit 5**:\n\n[password]",
  "extracted": {
    "intent": "property_query",
    "propertyName": "Unit 5",
    "informationToFind": "WiFi password"
  }
}
```

## Troubleshooting

### 404 Error on `/api/proxyWebhook`

Make sure you're running `vercel dev` (not just `npm run dev`). The API functions only work with Vercel's dev server.

### Google Sheets Access Denied

1. Ensure your service account email has access to the Google Sheet
2. Share the sheet with the service account email
3. Verify the service account has the "Google Sheets API" enabled

### Groq API Errors

- Check your API key is correct
- Verify you have available quota
- Check the model name matches available models

## License

MIT

