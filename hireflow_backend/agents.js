/**
 * AI Agents Module (Gemini API)
 * 
 * Three specialized agents:
 * 1. HR Agent - Evaluates cultural fit and soft skills
 * 2. Manager Agent - Evaluates technical capabilities
 * 3. Sales Agent - Evaluates business impact potential
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let genAI;

export async function initializeAgents() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('❌ GEMINI_API_KEY not set in .env file');
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('✅ Gemini API initialized');
    console.log('🤖 3 AI Agents ready: HR, Manager, Sales');
  } catch (error) {
    console.error('❌ Agents initialization failed:', error.message);
    throw error;
  }
}

// ============================================
// AGENT PROMPTS
// ============================================

const HR_AGENT_PROMPT = `You are an expert HR recruiter evaluating a candidate for a {role} position.

CANDIDATE INFO:
Name: {name}
Email: {email}
Role Applying For: {role}
CV:
{cv_text}

EVALUATE THE CANDIDATE ON:
1. Cultural fit and team compatibility
2. Soft skills (communication, leadership, collaboration)
3. Career progression and stability
4. Work-life balance indicators
5. Reliability and commitment signals

RESPOND IN JSON FORMAT:
{
  "score": <1-10>,
  "recommendation": "<STRONG_YES/YES/MAYBE/NO>",
  "analysis": {
    "cultural_fit": "<assessment>",
    "soft_skills": "<assessment>",
    "stability": "<assessment>",
    "concerns": "<any concerns>"
  }
}`;

const MANAGER_AGENT_PROMPT = `You are a technical manager evaluating a candidate for a {role} position.

CANDIDATE INFO:
Name: {name}
Email: {email}
Role Applying For: {role}
CV:
{cv_text}

EVALUATE THE CANDIDATE ON:
1. Technical skills and experience level
2. Problem-solving ability indicators
3. Relevant project experience
4. Technology stack alignment
5. Learning ability and growth potential

RESPOND IN JSON FORMAT:
{
  "score": <1-10>,
  "recommendation": "<STRONG_YES/YES/MAYBE/NO>",
  "analysis": {
    "technical_skills": "<assessment>",
    "experience_level": "<assessment>",
    "stack_alignment": "<assessment>",
    "learning_potential": "<assessment>",
    "gaps": "<any skill gaps>"
  }
}`;

const SALES_AGENT_PROMPT = `You are a business development lead evaluating a candidate for a {role} position.

CANDIDATE INFO:
Name: {name}
Email: {email}
Role Applying For: {role}
CV:
{cv_text}

EVALUATE THE CANDIDATE ON:
1. Business impact potential
2. Revenue or value generation capability
3. Network and business development skills
4. Deal-making and negotiation ability
5. Customer or stakeholder management experience

RESPOND IN JSON FORMAT:
{
  "score": <1-10>,
  "recommendation": "<STRONG_YES/YES/MAYBE/NO>",
  "analysis": {
    "business_impact": "<assessment>",
    "revenue_potential": "<assessment>",
    "sales_skills": "<assessment>",
    "network_value": "<assessment>",
    "challenges": "<any challenges>"
  }
}`;

// ============================================
// AGENT CLASSES
// ============================================

class Agent {
  constructor(name, prompt) {
    this.name = name;
    this.prompt = prompt;
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }
  
  async evaluate(candidate) {
    try {
      console.log(`🤖 ${this.name} evaluating ${candidate.name}...`);
      
      const prompt = this.prompt
        .replace('{name}', candidate.name)
        .replace('{email}', candidate.email)
        .replace('{role}', candidate.role_applying)
        .replace('{cv_text}', candidate.cv_text.substring(0, 2000)); // Limit CV length
      
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const evaluation = JSON.parse(jsonMatch[0]);
      
      console.log(`✅ ${this.name} score: ${evaluation.score}/10 - ${evaluation.recommendation}`);
      
      return evaluation;
    } catch (error) {
      console.error(`❌ ${this.name} evaluation failed:`, error.message);
      
      // Return default evaluation on error
      return {
        score: 5,
        recommendation: 'MAYBE',
        analysis: {
          error: error.message,
          note: 'Evaluation failed, returning neutral score'
        }
      };
    }
  }
}

// ============================================
// MULTI-AGENT EVALUATION
// ============================================

export async function evaluateCandidate(candidate) {
  try {
    console.log(`\n📊 Starting multi-agent evaluation for ${candidate.name}`);
    console.log('=' .repeat(60));
    
    // Create agents
    const hrAgent = new Agent('HR Agent', HR_AGENT_PROMPT);
    const managerAgent = new Agent('Manager Agent', MANAGER_AGENT_PROMPT);
    const salesAgent = new Agent('Sales Agent', SALES_AGENT_PROMPT);
    
    // Run evaluations in parallel
    const [hrEval, managerEval, salesEval] = await Promise.all([
      hrAgent.evaluate(candidate),
      managerAgent.evaluate(candidate),
      salesAgent.evaluate(candidate)
    ]);
    
    const evaluations = {
      hr: hrEval,
      manager: managerEval,
      sales: salesEval
    };
    
    console.log('=' .repeat(60));
    console.log('✅ Multi-agent evaluation complete\n');
    
    return evaluations;
  } catch (error) {
    console.error('❌ Multi-agent evaluation failed:', error);
    throw error;
  }
}

// ============================================
// AGENT NEGOTIATION (if scores conflict)
// ============================================

export async function negotiateScores(evaluations) {
  try {
    const avgScore = (evaluations.hr.score + evaluations.manager.score + evaluations.sales.score) / 3;
    const maxDiff = Math.max(
      Math.abs(evaluations.hr.score - avgScore),
      Math.abs(evaluations.manager.score - avgScore),
      Math.abs(evaluations.sales.score - avgScore)
    );
    
    if (maxDiff > 2) {
      console.log('⚖️ Score discrepancy detected, agents negotiating...');
      
      // Ask agents to reconsider
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const negotiationPrompt = `You are a Senior Hiring Director acting as a mediator. Three of your AI agents have provided conflicting evaluations for a candidate. Your task is to analyze their detailed reports and determine a final, reconciled score and provide your reasoning.

AGENT EVALUATIONS:
1.  **HR Agent (Cultural & Soft Skills):**
    - Score: ${evaluations.hr.score}/10
    - Recommendation: ${evaluations.hr.recommendation}
    - Analysis: ${JSON.stringify(evaluations.hr.analysis)}

2.  **Manager Agent (Technical Skills):**
    - Score: ${evaluations.manager.score}/10
    - Recommendation: ${evaluations.manager.recommendation}
    - Analysis: ${JSON.stringify(evaluations.manager.analysis)}

3.  **Sales Agent (Business Impact):**
    - Score: ${evaluations.sales.score}/10
    - Recommendation: ${evaluations.sales.recommendation}
    - Analysis: ${JSON.stringify(evaluations.sales.analysis)}

Based on this conflicting input, provide a final consensus score and a brief reasoning for your decision. The reasoning should explain how you weighed the different perspectives (e.g., "The technical skills are strong, but the cultural fit concerns from HR are significant, leading to a moderated score.").

Respond ONLY in valid JSON format:
{
  "consensus_score": <1-10>,
  "reasoning": "<explanation>"
}
      `;
      
      const result = await model.generateContent(negotiationPrompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const negotiation = JSON.parse(jsonMatch[0]);
        console.log(`✅ Consensus reached: ${negotiation.consensus_score}/10`);
        return negotiation;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Negotiation error:', error);
    return null;
  }
}
