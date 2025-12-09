/**
 * HireFlow AI - Raindrop Backend
 * Multi-Agent Hiring Platform
 * 
 * Tech Stack:
 * - Backend: Node.js + Express (on Raindrop)
 * - Database: SmartSQL (Raindrop)
 * - Memory: SmartMemory (Raindrop)
 * - Cache: Vultr Valkey (Redis)
 * - AI: Gemini API (free)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase } from './database.js';
import { initializeRedis, getRedis, setRedis, deleteRedis } from './redis.js';
import { initializeAgents, evaluateCandidate } from './agents.js';
import { decideHiring } from './decision.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true
}));

// ============================================
// INITIALIZE SERVICES
// ============================================

let db;
let redis;

async function initializeServices() {
  try {
    console.log('🚀 Initializing HireFlow AI Backend...');
    
    // Initialize Redis (Vultr Valkey)
    redis = await initializeRedis();
    console.log('✅ Redis (Valkey) connected');
    
    // Initialize Database (SmartSQL)
    db = await initializeDatabase();
    console.log('✅ Database (SmartSQL) initialized');
    
    // Initialize AI Agents (Gemini)
    await initializeAgents();
    console.log('✅ AI Agents (Gemini) initialized');
    
    console.log('✅ All services ready!\n');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// ============================================
// ROUTES - HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HireFlow AI - Raindrop Backend'
  });
});

// ============================================
// ROUTES - CANDIDATE UPLOAD
// ============================================

app.post('/api/candidates/upload', async (req, res) => {
  try {
    const { name, email, cv_text, role_applying } = req.body;
    
    // Validation
    if (!name || !email || !cv_text || !role_applying) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create candidate
    const candidateId = uuidv4();
    const candidate = {
      id: candidateId,
      name,
      email,
      cv_text,
      role_applying,
      uploaded_at: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save to database (SmartSQL)
    await db.saveCandidateQuery(candidate);
    
    // Cache in Redis for quick access
    await setRedis(`candidate:${candidateId}`, JSON.stringify(candidate), 3600);
    
    // Create session
    const session = {
      candidate_id: candidateId,
      status: 'ready_to_evaluate',
      created_at: new Date().toISOString(),
      evaluations: {},
      decision: null
    };
    
    await setRedis(`session:${candidateId}`, JSON.stringify(session), 86400);
    
    res.json({
      success: true,
      candidate_id: candidateId,
      message: 'Candidate uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES - START EVALUATION
// ============================================

app.post('/api/candidates/:candidateId/evaluate', async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    // Get candidate from cache or database
    let candidate = await getRedis(`candidate:${candidateId}`);
    if (!candidate) {
      candidate = await db.getCandidateQuery(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
    } else {
      candidate = JSON.parse(candidate);
    }
    
    // Update session status
    const session = {
      candidate_id: candidateId,
      status: 'evaluating',
      created_at: new Date().toISOString(),
      evaluations: {},
      decision: null
    };
    
    // Run multi-agent evaluation
    console.log(`📊 Starting evaluation for ${candidate.name}...`);
    
    const evaluations = await evaluateCandidate(candidate);
    
    // Store evaluations
    session.evaluations = evaluations;
    
    // Save to database
    await db.saveEvaluationsQuery(candidateId, evaluations);
    
    // Update cache
    await setRedis(`session:${candidateId}`, JSON.stringify(session), 86400);
    
    res.json({
      success: true,
      candidate_id: candidateId,
      evaluations: evaluations
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES - GET DECISION
// ============================================

app.post('/api/candidates/:candidateId/decide', async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    // Get session
    let sessionStr = await getRedis(`session:${candidateId}`);
    if (!sessionStr) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = JSON.parse(sessionStr);
    
    if (!session.evaluations || Object.keys(session.evaluations).length === 0) {
      return res.status(400).json({ error: 'No evaluations found' });
    }
    
    // Make final decision
    console.log(`⚖️ Making decision for ${candidateId}...`);
    
    const decision = await decideHiring(session.evaluations);
    
    // Store decision
    session.decision = decision;
    session.status = 'completed';
    
    await db.saveDecisionQuery(candidateId, decision);
    await setRedis(`session:${candidateId}`, JSON.stringify(session), 86400);
    
    res.json({
      success: true,
      candidate_id: candidateId,
      decision: decision
    });
  } catch (error) {
    console.error('Decision error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES - GET STATUS
// ============================================

app.get('/api/candidates/:candidateId/status', async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    let sessionStr = await getRedis(`session:${candidateId}`);
    if (!sessionStr) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = JSON.parse(sessionStr);
    
    res.json({
      candidate_id: candidateId,
      status: session.status,
      evaluations_count: Object.keys(session.evaluations).length,
      has_decision: session.decision !== null,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES - GET FULL RESULT
// ============================================

app.get('/api/candidates/:candidateId/result', async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    const [candidateStr, sessionStr] = await Promise.all([
      getRedis(`candidate:${candidateId}`),
      getRedis(`session:${candidateId}`)
    ]);
    
    if (!candidateStr || !sessionStr) {
      return res.status(404).json({ error: 'Candidate or session not found' });
    }
    
    const candidate = JSON.parse(candidateStr);
    const session = JSON.parse(sessionStr);
    
    res.json({
      success: true,
      candidate,
      session
    });
  } catch (error) {
    console.error('Result error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ERROR HANDLERS
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================
// START SERVER
// ============================================

async function start() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`🎯 HireFlow AI Backend running on http://localhost:${PORT}`);
      console.log(`📊 API ready for Raindrop deployment`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
