/**
 * AI Agents Module (Raindrop SmartInference)
 *
 * Three specialized agents:
 * 1. HR Agent - Evaluates cultural fit and soft skills
 * 2. Manager Agent - Evaluates technical capabilities
 * 3. Sales Agent - Evaluates business impact potential
 */
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

let smartInferenceUrl;

export function initializeAgents() {
  try {
    smartInferenceUrl = process.env.RAINDROP_SMART_INFERENCE_URL;
    if (!smartInferenceUrl) {
      throw new Error('RAINDROP_SMART_INFERENCE_URL not set in .env file');
    }

    console.log('✅ SmartInference initialized');
    console.log('🤖 3 AI Agents ready: HR, Manager, Sales');
  } catch (error) {
    console.error('❌ Agents initialization failed:', error.message);
    throw error;
  }
}

/**
 * A simple, promise-based HTTPS POST client to call the SmartInference endpoint.
 * @param {string} model - The name of the model to use (e.g., 'gemini-pro').
 * @param {string} prompt - The prompt to send to the model.
 * @returns {Promise<string>} - The text response from the model.
 */
function callSmartInference(model, prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      prompt,
    });

    const url = new URL(smartInferenceUrl);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Assuming the response is JSON with a "text" property
            const jsonResponse = JSON.parse(data);
            resolve(jsonResponse.text);
          } catch(e) {
            reject(new Error('Failed to parse JSON response from SmartInference'));
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(payload);
    req.end();
  });
}


// ============================================
// AGENT PROMPTS (No changes needed here)
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

const NEGOTIATION_PROMPT = `You are a Senior Hiring Director acting as a mediator. Three of your AI agents have provided conflicting evaluations for a candidate. Your task is to analyze their detailed reports and determine a final, reconciled score and provide your reasoning.

AGENT EVALUATIONS:
1.  **HR Agent (Cultural & Soft Skills):**
    - Score: {hr_score}/10
    - Recommendation: {hr_recommendation}
    - Analysis: {hr_analysis}

2.  **Manager Agent (Technical Skills):**
    - Score: {manager_score}/10
    - Recommendation: {manager_recommendation}
    - Analysis: {manager_analysis}

3.  **Sales Agent (Business Impact):**
    - Score: {sales_score}/10
    - Recommendation: {sales_recommendation}
    - Analysis: {sales_analysis}

Based on this conflicting input, provide a final consensus score and a brief reasoning for your decision. The reasoning should explain how you weighed the different perspectives (e.g., "The technical skills are strong, but the cultural fit concerns from HR are significant, leading to a moderated score.").

Respond ONLY in valid JSON format:
{
  "consensus_score": <1-10>,
  "reasoning": "<explanation>"
}`;

// ============================================
// AGENT CLASSES
// ============================================

class Agent {
  constructor(name, prompt) {
    this.name = name;
    this.prompt = prompt;
    this.modelName = 'gemini-pro'; // As defined in raindrop.json
  }

  async evaluate(candidate) {
    try {
      console.log(`🤖 ${this.name} evaluating ${candidate.name}...`);

      const filledPrompt = this.prompt
        .replace(/{name}/g, candidate.name)
        .replace(/{email}/g, candidate.email)
        .replace(/{role}/g, candidate.role_applying)
        .replace(/{cv_text}/g, candidate.cv_text.substring(0, 2000)); // Limit CV length

      const responseText = await callSmartInference(this.modelName, filledPrompt);

      // Parse JSON from response
      const regex = /\{[\s\S]*\}/;
      const jsonMatch = regex.exec(responseText);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        console.log(`✅ ${this.name} score: ${evaluation.score}/10 - ${evaluation.recommendation}`);
        return evaluation;
      }
      throw new Error('Invalid JSON response format from agent');
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
    console.log('='.repeat(60));

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

    console.log('='.repeat(60));
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

      const negotiationPrompt = NEGOTIATION_PROMPT
        .replace('{hr_score}', evaluations.hr.score)
        .replace('{hr_recommendation}', evaluations.hr.recommendation)
        .replace('{hr_analysis}', JSON.stringify(evaluations.hr.analysis))
        .replace('{manager_score}', evaluations.manager.score)
        .replace('{manager_recommendation}', evaluations.manager.recommendation)
        .replace('{manager_analysis}', JSON.stringify(evaluations.manager.analysis))
        .replace('{sales_score}', evaluations.sales.score)
        .replace('{sales_recommendation}', evaluations.sales.recommendation)
        .replace('{sales_analysis}', JSON.stringify(evaluations.sales.analysis));
      
      const responseText = await callSmartInference('gemini-pro', negotiationPrompt);

      const regex = /\{[\s\S]*\}/;
      const jsonMatch = regex.exec(responseText);
      if (jsonMatch) {
        const negotiation = JSON.parse(jsonMatch[0]);
        console.log(`✅ Consensus reached: ${negotiation.consensus_score}/10`);
        return negotiation;
      }
      throw new Error('Failed to parse JSON negotiation from AI response');
    }

    return null;
  } catch (error) {
    console.error('Negotiation error:', error);
    return null;
  }
}
