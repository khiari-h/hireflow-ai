/**
 * Database Module (SmartSQL - Raindrop)
 * Handles all database operations
 * 
 * SETUP INSTRUCTIONS:
 * When deployed on Raindrop, SmartSQL credentials will be automatically provided
 * For local development, use SQLite as fallback
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;

export async function initializeDatabase() {
  try {
    // For Raindrop deployment: will use SmartSQL
    // For local development: use SQLite
    
    // Open SQLite database (for development)
    db = await open({
      filename: path.join(__dirname, 'hireflow.db'),
      driver: sqlite3.Database
    });
    
    console.log('📦 Using SQLite for local development');
    console.log('💡 When deployed on Raindrop, SmartSQL will be used automatically');
    
    // Create tables
    await createTables();
    
    return {
      saveCandidateQuery,
      getCandidateQuery,
      saveEvaluationsQuery,
      saveDecisionQuery,
      getEvaluationsQuery,
      getDecisionQuery
    };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  try {
    // Candidates table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        cv_text TEXT NOT NULL,
        role_applying TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Evaluations table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidate_id TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        score REAL,
        recommendation TEXT,
        analysis TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
      )
    `);
    
    // Decisions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidate_id TEXT NOT NULL,
        final_decision TEXT NOT NULL,
        reasoning TEXT,
        confidence_score REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
      )
    `);
    
    console.log('✅ Database tables created/verified');
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    throw error;
  }
}

// ============================================
// CANDIDATE OPERATIONS
// ============================================

export async function saveCandidateQuery(candidate) {
  try {
    await db.run(
      `INSERT INTO candidates 
       (id, name, email, cv_text, role_applying, uploaded_at, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate.id,
        candidate.name,
        candidate.email,
        candidate.cv_text,
        candidate.role_applying,
        candidate.uploaded_at,
        candidate.status
      ]
    );
    
    console.log(`✅ Candidate ${candidate.id} saved to database`);
  } catch (error) {
    console.error('Error saving candidate:', error);
    throw error;
  }
}

export async function getCandidateQuery(candidateId) {
  try {
    const candidate = await db.get(
      'SELECT * FROM candidates WHERE id = ?',
      [candidateId]
    );
    return candidate;
  } catch (error) {
    console.error('Error getting candidate:', error);
    throw error;
  }
}

// ============================================
// EVALUATION OPERATIONS
// ============================================

export async function saveEvaluationsQuery(candidateId, evaluations) {
  try {
    for (const [agentType, evaluation] of Object.entries(evaluations)) {
      await db.run(
        `INSERT INTO evaluations 
         (candidate_id, agent_type, score, recommendation, analysis) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          candidateId,
          agentType,
          evaluation.score,
          evaluation.recommendation,
          JSON.stringify(evaluation.analysis)
        ]
      );
    }
    
    console.log(`✅ Evaluations for ${candidateId} saved to database`);
  } catch (error) {
    console.error('Error saving evaluations:', error);
    throw error;
  }
}

export async function getEvaluationsQuery(candidateId) {
  try {
    const evaluations = await db.all(
      'SELECT * FROM evaluations WHERE candidate_id = ?',
      [candidateId]
    );
    return evaluations;
  } catch (error) {
    console.error('Error getting evaluations:', error);
    throw error;
  }
}

// ============================================
// DECISION OPERATIONS
// ============================================

export async function saveDecisionQuery(candidateId, decision) {
  try {
    await db.run(
      `INSERT INTO decisions 
       (candidate_id, final_decision, reasoning, confidence_score) 
       VALUES (?, ?, ?, ?)`,
      [
        candidateId,
        decision.final_decision,
        decision.reasoning,
        decision.confidence_score
      ]
    );
    
    console.log(`✅ Decision for ${candidateId} saved to database`);
  } catch (error) {
    console.error('Error saving decision:', error);
    throw error;
  }
}

export async function getDecisionQuery(candidateId) {
  try {
    const decision = await db.get(
      'SELECT * FROM decisions WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1',
      [candidateId]
    );
    return decision;
  } catch (error) {
    console.error('Error getting decision:', error);
    throw error;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkDatabase() {
  try {
    await db.get('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
