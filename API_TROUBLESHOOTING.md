# API Connection Troubleshooting

## Error: "Failed to fetch"

This error occurs when the frontend cannot connect to the backend API servers. Here's how to fix it:

### 1. Check API Server Status

Make sure all three backend services are running:

- **Holder API** (Port 8002)
- **Issuer API** (Port 8000)
- **Verifier API** (Port 8001)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with your API endpoints:

```env
# For GitHub Codespaces (update with your actual codespace URLs)
NEXT_PUBLIC_HOLDER_API_BASE_URL=https://your-codespace-url-8002.app.github.dev
NEXT_PUBLIC_ISSUER_API_BASE_URL=https://your-codespace-url-8000.app.github.dev
NEXT_PUBLIC_VERIFIER_API_BASE_URL=https://your-codespace-url-8001.app.github.dev

# For local development
# NEXT_PUBLIC_HOLDER_API_BASE_URL=http://localhost:8002
# NEXT_PUBLIC_ISSUER_API_BASE_URL=http://localhost:8000
# NEXT_PUBLIC_VERIFIER_API_BASE_URL=http://localhost:8001
```

### 3. Verify CORS Configuration

Ensure your backend APIs have CORS enabled. Example for FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Check Network Connectivity

- Verify you can access the API URLs directly in your browser
- Check if the APIs return JSON responses
- Ensure no firewall is blocking the connections

### 5. View API Configuration

Open the browser console to see the current API configuration. In development mode, it will log:

```
API Configuration: {
  holder: "https://...",
  issuer: "https://...",
  verifier: "https://..."
}
```

### 6. Error Handling Features

The application now includes:

- **Network Error Detection**: Catches connection failures with user-friendly messages
- **API Error Boundary**: Shows a full-page error with retry option
- **Connection Status**: Shows an alert when you go offline
- **Smart Token Handling**: Keeps your token during network errors (only clears on 401/403)

### 7. Common Fixes

#### API not responding
```bash
# Restart your API servers
# For the holder service:
cd backend/holder
uvicorn main:app --reload --port 8002
```

#### CORS errors
Check browser console for "CORS policy" errors and ensure your backend allows the frontend origin.

#### Port conflicts
Make sure the ports 8000, 8001, and 8002 are not being used by other applications.

### 8. Development Tips

When developing locally:

1. Start all three backend services first
2. Then start the frontend: `npm run dev`
3. Check the console for "API Configuration" log
4. If you see connection errors, verify the URLs are correct

### 9. Production Deployment

For production, set environment variables in your hosting platform:

- **Vercel**: Add env vars in Project Settings
- **Netlify**: Add in Site Configuration > Environment Variables
- **Docker**: Use `.env` file or pass as build args

## Need Help?

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Verify API endpoints are accessible
3. Ensure CORS is properly configured
4. Check network tab in DevTools for failed requests
