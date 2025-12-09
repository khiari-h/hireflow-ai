/**
 * Decision Engine Module
 * Synthesizes agent evaluations into final hiring decision
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { negotiateScores } from './agents.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function decideHiring(evaluations) {
  try {
    console.log('\n⚖️ Decision Engine analyzing evaluations...');

    // 1. Check for major discrepancies and negotiate if needed
    const negotiationResult = await negotiateScores(evaluations);

    // 2. Call a "Hiring Director" agent to make the final call
    const decision = await generateFinalDecision(evaluations, negotiationResult);

    // 3. If the decision is 'MAYBE', generate a follow-up question for interaction
    if (decision.final_decision === 'MAYBE' && !decision.follow_up_question) {
      const followUp = await generateFollowUpQuestion(evaluations);
      if (followUp) {
        decision.follow_up_question = followUp;
        decision.reasoning += " A follow-up question is recommended to clarify ambiguities.";
      }
    }

    console.log(`✅ Decision: ${decision.final_decision}`);
    console.log(`📊 Confidence: ${(decision.confidence_score * 100).toFixed(0)}%`);

    return decision;
  } catch (error) {
    console.error('❌ Decision engine error:', error);

    // Return neutral decision on error
    return {
      final_decision: 'MAYBE',
      confidence_score: 0.5,
      reasoning: 'Decision could not be fully evaluated. Recommend manual review.',
      error: error.message,
      details: {}
    };
  }
}

async function generateFinalDecision(evaluations, negotiationResult) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are the Head of Talent Acquisition. You have received evaluations from three of your AI agents. Your job is to make the final hiring decision.

HR Agent Score: ${evaluations.hr?.score}/10
- Recommendation: ${evaluations.hr?.recommendation}
- Key insight: ${JSON.stringify(evaluations.hr?.analysis).substring(0, 100)}

Manager Agent Score: ${evaluations.manager?.score}/10
- Recommendation: ${evaluations.manager?.recommendation}
- Key insight: ${JSON.stringify(evaluations.manager?.analysis).substring(0, 100)}

Sales Agent Score: ${evaluations.sales?.score}/10
- Recommendation: ${evaluations.sales?.recommendation}
- Key insight: ${JSON.stringify(evaluations.sales?.analysis).substring(0, 100)}

${negotiationResult ? `A negotiation was required. Consensus Score: ${negotiationResult.consensus_score}/10. Reasoning: ${negotiationResult.reasoning}` : 'The agents were generally in agreement.'}

Based on all this information, make a final decision.

Respond ONLY in valid JSON format:
{
  "final_decision": "<HIRE/REJECT/MAYBE>",
  "confidence_score": <0.0-1.0>,
  "reasoning": "<Your concise (2-3 sentences) reasoning for the final decision.>",
  "details": {
    "hr_score": ${evaluations.hr?.score || 0},
    "manager_score": ${evaluations.manager?.score || 0},
    "sales_score": ${evaluations.sales?.score || 0},
    "average_score": ${(evaluations.hr?.score + evaluations.manager?.score + evaluations.sales?.score) / 3}
  }
}`;

    const result = await model.generateContent(prompt);
    const regex = /\{[\s\S]*\}/;
    const jsonMatch = regex.exec(result.response.text());
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse JSON decision from AI response');
  } catch (error) {
    console.error('Error generating final decision:', error);
    return null;
  }
}

async function generateFollowUpQuestion(evaluations) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Based on the following conflicting evaluations, generate one single, concise interview question for the candidate to clarify the main point of contention.

HR Agent Score: ${evaluations.hr?.score}/10 (${evaluations.hr?.recommendation})
- Key insight: ${JSON.stringify(evaluations.hr?.analysis).substring(0, 100)}

Manager Agent Score: ${evaluations.manager?.score}/10 (${evaluations.manager?.recommendation})
- Key insight: ${JSON.stringify(evaluations.manager?.analysis).substring(0, 100)}

Sales Agent Score: ${evaluations.sales?.score}/10 (${evaluations.sales?.recommendation})
- Key insight: ${JSON.stringify(evaluations.sales?.analysis).substring(0, 100)}

Example question: "Your technical skills are evident, but can you provide an example of a project where you had to lead a team to meet a tight deadline?"

Generate one question:`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating follow-up question:', error);
    return null;
  }
}
// ============================================
// SCORING UTILITIES
// ============================================

export function getScoreColor(score) {
  if (score >= 8) return 'green';
  if (score >= 6) return 'yellow';
  if (score >= 4) return 'orange';
  return 'red';
}

export function getScoreLabel(score) {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Poor';
  return 'Critical';
}

export function getRecommendationEmoji(recommendation) {
  const emojis = {
    'STRONG_YES': '✅✅',
    'YES': '✅',
    'MAYBE': '❓',
    'NO': '❌'
  };
  return emojis[recommendation] || '❓';
}
