# 🚀 Guide de Démarrage Rapide

## Étape 1 : Obtenir la Clé API Gemini (2 min)

1. Allez sur : https://aistudio.google.com/app/apikey
2. Cliquez sur "Create API key in new project"
3. Copiez la clé
4. Collez-la dans le fichier `.env` :
   ```
   GEMINI_API_KEY=your_key_here
   ```

## Étape 2 : Installer les Dépendances (1 min)

```bash
npm install
```

## Step 3: Start Server (1 min)

```bash
npm start
```

You should see:
```
✅ Redis (Valkey) connected
✅ Database (SmartSQL) initialized
✅ AI Agents (Gemini) initialized
✅ All services ready!

🎯 HireFlow AI Backend running on http://localhost:3000
📊 API ready for Raindrop deployment
```

## Step 4: Test the API (2 min)

### Test Upload:
```bash
curl -X POST http://localhost:3000/api/candidates/upload \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "cv_text": "Senior Backend Engineer with 8 years of experience in Python, Node.js, and system design.",
    "role_applying": "Senior Backend Developer"
  }'
```

Response:
```json
{
  "success": true,
  "candidate_id": "abc-123-def-456"
}
```

### Test Evaluation:
```bash
curl -X POST http://localhost:3000/api/candidates/{candidate_id}/evaluate
```

Wait 10-15 seconds for Gemini to evaluate...

Response:
```json
{
  "success": true,
  "evaluations": {
    "hr": { "score": 8, "recommendation": "STRONG_YES", ... },
    "manager": { "score": 7, "recommendation": "YES", ... },
    "sales": { "score": 8, "recommendation": "STRONG_YES", ... }
  }
}
```

### Test Decision:
```bash
curl -X POST http://localhost:3000/api/candidates/{candidate_id}/decide
```

Response:
```json
{
  "success": true,
  "decision": {
    "final_decision": "HIRE",
    "confidence_score": 0.87,
    "reasoning": "..."
  }
}
```

## ✅ All Set!

Backend is ready to:
- ✅ Receive CV uploads
- ✅ Run multi-agent evaluations
- ✅ Make hiring decisions
- ✅ Cache data in Redis
- ✅ Store in SmartSQL

Next: Connect to frontend!

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY not set"
**Solution:** Add your API key to `.env` file

### Error: "Cannot find module sqlite3"
**Solution:** Run `npm install sqlite3`

### Evaluation taking too long
**Normal:** Gemini API calls take 5-15 seconds per agent

### Need to reset database?
**Solution:** Delete `hireflow.db` file and restart

---

Questions? Check README.md for detailed docs!
