"""
HireFlow AI - Multi-Agent Hiring + Onboarding System
Backend main application
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
import asyncio
from typing import Dict, List
import json

# Import agents
from agents.rh_agent import RHAgent
from agents.manager_agent import ManagerAgent
from agents.sales_agent import SalesAgent
from agents.decision_engine import DecisionEngine
from agents.onboarding_agent import OnboardingAgent

# Import database
from database import init_db, save_candidate, save_evaluation, save_decision, get_candidate

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize database
init_db()

# Store active evaluation sessions
active_sessions = {}

# ============================================
# ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()}), 200


@app.route('/api/candidates/upload', methods=['POST'])
def upload_candidate():
    """
    Upload candidate CV and basic info
    
    Expected JSON:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "cv_text": "...",
        "role_applying": "Senior Backend Developer"
    }
    """
    try:
        data = request.json
        
        # Validate required fields
        required = ["name", "email", "cv_text", "role_applying"]
        if not all(field in data for field in required):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Create candidate record
        candidate_id = str(uuid.uuid4())
        candidate = {
            "id": candidate_id,
            "name": data["name"],
            "email": data["email"],
            "cv_text": data["cv_text"],
            "role_applying": data["role_applying"],
            "uploaded_at": datetime.now().isoformat(),
            "status": "pending"
        }
        
        # Save to database
        save_candidate(candidate)
        
        # Create evaluation session
        active_sessions[candidate_id] = {
            "candidate": candidate,
            "status": "ready_to_evaluate",
            "evaluations": {},
            "decision": None
        }
        
        return jsonify({
            "success": True,
            "candidate_id": candidate_id,
            "message": "Candidate uploaded successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/candidates/<candidate_id>/evaluate', methods=['POST'])
def start_evaluation(candidate_id):
    """
    Start the multi-agent evaluation process
    Runs: RH → Manager → Sales in parallel, then Decision Engine
    """
    try:
        if candidate_id not in active_sessions:
            return jsonify({"error": "Candidate not found"}), 404
        
        session = active_sessions[candidate_id]
        session["status"] = "evaluating"
        
        candidate = session["candidate"]
        
        # ============================================
        # PARALLEL AGENT EVALUATIONS
        # ============================================
        
        # Initialize agents
        rh = RHAgent()
        manager = ManagerAgent()
        sales = SalesAgent()
        
        # Run evaluations in parallel (simulate with threading/async)
        rh_eval = rh.evaluate(candidate)
        manager_eval = manager.evaluate(candidate)
        sales_eval = sales.evaluate(candidate)
        
        # Store evaluations
        session["evaluations"]["rh"] = rh_eval
        session["evaluations"]["manager"] = manager_eval
        session["evaluations"]["sales"] = sales_eval
        
        # Save to database
        save_evaluation(candidate_id, "rh", rh_eval)
        save_evaluation(candidate_id, "manager", manager_eval)
        save_evaluation(candidate_id, "sales", sales_eval)
        
        # ============================================
        # CHECK FOR CONFLICTS (Mini-Negotiation)
        # ============================================
        
        score_gap = max(
            abs(rh_eval["score"] - manager_eval["score"]),
            abs(manager_eval["score"] - sales_eval["score"]),
            abs(rh_eval["score"] - sales_eval["score"])
        )
        
        negotiation_result = None
        if score_gap > 1.5:
            session["status"] = "negotiating"
            
            decision_engine = DecisionEngine()
            negotiation_result = decision_engine.mini_negotiate(
                rh_eval, 
                manager_eval, 
                sales_eval
            )
            
            session["negotiation"] = negotiation_result
        
        # ============================================
        # FINAL DECISION
        # ============================================
        
        decision_engine = DecisionEngine()
        final_decision = decision_engine.make_decision(
            rh_eval,
            manager_eval,
            sales_eval,
            negotiation_result
        )
        
        session["decision"] = final_decision
        session["status"] = "completed"
        
        # Save decision to database
        save_decision(candidate_id, final_decision)
        
        return jsonify({
            "success": True,
            "candidate_id": candidate_id,
            "evaluations": {
                "rh": rh_eval,
                "manager": manager_eval,
                "sales": sales_eval
            },
            "negotiation": negotiation_result,
            "decision": final_decision
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/candidates/<candidate_id>/status', methods=['GET'])
def get_status(candidate_id):
    """Get current evaluation status"""
    try:
        if candidate_id not in active_sessions:
            return jsonify({"error": "Candidate not found"}), 404
        
        session = active_sessions[candidate_id]
        
        return jsonify({
            "candidate_id": candidate_id,
            "status": session["status"],
            "evaluations_done": list(session["evaluations"].keys()),
            "has_negotiation": "negotiation" in session,
            "has_decision": session["decision"] is not None
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/candidates/<candidate_id>/decision', methods=['GET'])
def get_decision(candidate_id):
    """Get final hiring decision"""
    try:
        if candidate_id not in active_sessions:
            return jsonify({"error": "Candidate not found"}), 404
        
        session = active_sessions[candidate_id]
        
        if not session["decision"]:
            return jsonify({"error": "Decision not yet available"}), 400
        
        decision = session["decision"]
        
        # If hired, generate onboarding plan
        onboarding = None
        if decision["final_decision"] == "HIRE":
            consultant = OnboardingAgent()
            onboarding = consultant.create_onboarding_plan(
                session["candidate"],
                session["evaluations"]
            )
        
        return jsonify({
            "success": True,
            "candidate_id": candidate_id,
            "decision": decision,
            "onboarding": onboarding
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/candidates/<candidate_id>/onboarding', methods=['GET'])
def get_onboarding(candidate_id):
    """Get onboarding plan and progress"""
    try:
        if candidate_id not in active_sessions:
            return jsonify({"error": "Candidate not found"}), 404
        
        session = active_sessions[candidate_id]
        
        if session["decision"]["final_decision"] != "HIRE":
            return jsonify({"error": "Candidate was not hired"}), 400
        
        consultant = OnboardingAgent()
        plan = consultant.create_onboarding_plan(
            session["candidate"],
            session["evaluations"]
        )
        
        return jsonify({
            "success": True,
            "candidate_id": candidate_id,
            "onboarding_plan": plan
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# WEBSOCKET EVENTS (Real-time updates)
# ============================================

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")
    emit('response', {'data': 'Connected to HireFlow AI'})


@socketio.on('join_evaluation')
def on_join_evaluation(data):
    """Join a candidate's evaluation room"""
    candidate_id = data['candidate_id']
    join_room(candidate_id)
    emit('response', {'data': f'Joined evaluation for {candidate_id}'}, room=candidate_id)


@socketio.on('start_streaming_evaluation')
def on_start_streaming(data):
    """Start streaming evaluation updates to client"""
    candidate_id = data['candidate_id']
    
    if candidate_id not in active_sessions:
        emit('error', {'message': 'Candidate not found'})
        return
    
    # Emit evaluation progress
    emit('evaluation_started', {
        'candidate_id': candidate_id,
        'timestamp': datetime.now().isoformat()
    }, room=candidate_id)


# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    
    socketio.run(app, host='0.0.0.0', port=PORT, debug=DEBUG)
