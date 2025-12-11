/**
 * Database Module (SmartSQL - Raindrop)
 * Handles all database operations.
 * Dynamically supports PostgreSQL (for production via DATABASE_URL)
 * and SQLite (for local development).
 */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This will be our database adapter, whether it's pg or sqlite
let db;
let dbType;

// SQL dialect-specific statements
const createTablesSQL = {
  pg: `
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      cv_text TEXT NOT NULL,
      role_applying TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(id),
      agent_type TEXT NOT NULL,
      score REAL,
      recommendation TEXT,
      analysis TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS decisions (
      id SERIAL PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(id),
      final_decision TEXT NOT NULL,
      reasoning TEXT,
      confidence_score REAL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,
  sqlite: `
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      cv_text TEXT NOT NULL,
      role_applying TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT NOT NULL,
      agent_type TEXT NOT NULL,
      score REAL,
      recommendation TEXT,
      analysis TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    );
    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT NOT NULL,
      final_decision TEXT NOT NULL,
      reasoning TEXT,
      confidence_score REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    );
  `
};

// Simple adapter to handle differences between pg and sqlite
const dbAdapter = {
  exec: (sql) => db.query(sql),
  run: (sql, params = []) => {
    if (dbType === 'pg') {
      const pgSql = sql.replace(/\?/g, (match, index) => `$${(sql.slice(0, sql.indexOf(match))).split('?').length}`);
      return db.query(pgSql, params);
    }
    return db.run(sql, params);
  },
  get: async (sql, params = []) => {
    if (dbType === 'pg') {
      const pgSql = sql.replace(/\?/g, (match, index) => `$${(sql.slice(0, sql.indexOf(match))).split('?').length}`);
      const res = await db.query(pgSql, params);
      return res.rows[0];
    }
    return db.get(sql, params);
  },
  all: async (sql, params = []) => {
    if (dbType === 'pg') {
      const pgSql = sql.replace(/\?/g, (match, index) => `$${(sql.slice(0, sql.indexOf(match))).split('?').length}`);
      const res = await db.query(pgSql, params);
      return res.rows;
    }
    return db.all(sql, params);
  }
};


export async function initializeDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      // Production: Use PostgreSQL on Raindrop
      dbType = 'pg';
      db = new Pool({
        connectionString: databaseUrl,
      });
      console.log('📦 Using PostgreSQL for production');
      console.log('💡 Connecting via DATABASE_URL...');
      await db.connect();
      await dbAdapter.exec(createTablesSQL.pg);

    } else {
      // Development: Use SQLite fallback
      dbType = 'sqlite';
      db = await open({
        filename: path.join(__dirname, 'hireflow.db'),
        driver: sqlite3.Database
      });
      console.log('📦 Using SQLite for local development');
      await db.exec(createTablesSQL.sqlite);
    }
    
    console.log('✅ Database tables created/verified');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// ============================================
// CANDIDATE OPERATIONS
// ============================================

export async function saveCandidateQuery(candidate) {
  try {
    await dbAdapter.run(
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
    const candidate = await dbAdapter.get(
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
      await dbAdapter.run(
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
    const evaluations = await dbAdapter.all(
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
    await dbAdapter.run(
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
    const decision = await dbAdapter.get(
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
    await dbAdapter.get('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
