"""
Database API Routes
REST endpoints for database operations
"""

from flask import Blueprint, request, jsonify
import uuid
from src.database import Database

db_api = Blueprint('db_api', __name__, url_prefix='/api/db')
db = Database()

# ============================================================================
# STUDENT ENDPOINTS
# ============================================================================

@db_api.route('/students', methods=['POST'])
def create_student():
    """Create a new student"""
    data = request.json
    student_id = str(uuid.uuid4())
    
    success = db.create_student(
        student_id=student_id,
        name=data.get('name', 'Unknown'),
        age=data.get('age'),
        special_needs=data.get('special_needs'),
        language=data.get('language', 'en-US')
    )
    
    if success:
        return jsonify({'student_id': student_id, 'status': 'created'}), 201
    else:
        return jsonify({'error': 'Student already exists'}), 409

@db_api.route('/students/<student_id>', methods=['GET'])
def get_student(student_id):
    """Get student information"""
    student = db.get_student(student_id)
    if student:
        return jsonify(student), 200
    else:
        return jsonify({'error': 'Student not found'}), 404

@db_api.route('/students/<student_id>/stats', methods=['GET'])
def get_student_stats(student_id):
    """Get student statistics"""
    stats = db.get_session_stats(student_id)
    return jsonify(stats), 200

@db_api.route('/students/<student_id>/export', methods=['GET'])
def export_student_data(student_id):
    """Export all student data"""
    data = db.export_student_data(student_id)
    return jsonify(data), 200

# ============================================================================
# SESSION ENDPOINTS
# ============================================================================

@db_api.route('/sessions', methods=['POST'])
def create_session():
    """Create a new learning session"""
    data = request.json
    session_id = str(uuid.uuid4())
    
    success = db.create_session(
        session_id=session_id,
        student_id=data.get('student_id'),
        activity_id=data.get('activity_id')
    )
    
    if success:
        return jsonify({'session_id': session_id, 'status': 'created'}), 201
    else:
        return jsonify({'error': 'Failed to create session'}), 400

@db_api.route('/sessions/<session_id>/end', methods=['POST'])
def end_session(session_id):
    """End a learning session"""
    db.end_session(session_id)
    return jsonify({'status': 'ended'}), 200

# ============================================================================
# RESPONSE ENDPOINTS
# ============================================================================

@db_api.route('/responses', methods=['POST'])
def record_response():
    """Record a student response"""
    data = request.json
    response_id = str(uuid.uuid4())
    
    success = db.record_response(
        response_id=response_id,
        session_id=data.get('session_id'),
        student_id=data.get('student_id'),
        question_id=data.get('question_id'),
        response_text=data.get('response_text'),
        correct=data.get('correct', False),
        confidence=data.get('confidence', 0.0),
        emotion_state=data.get('emotion_state')
    )
    
    if success:
        return jsonify({'response_id': response_id, 'status': 'recorded'}), 201
    else:
        return jsonify({'error': 'Failed to record response'}), 400

# ============================================================================
# PROGRESS ENDPOINTS
# ============================================================================

@db_api.route('/progress/<student_id>/<activity_id>', methods=['GET'])
def get_progress(student_id, activity_id):
    """Get student progress for activity"""
    progress = db.get_progress(student_id, activity_id)
    if progress:
        return jsonify(progress), 200
    else:
        return jsonify({'error': 'No progress data found'}), 404

@db_api.route('/progress', methods=['POST'])
def update_progress():
    """Update student progress"""
    data = request.json
    
    db.update_progress(
        student_id=data.get('student_id'),
        activity_id=data.get('activity_id'),
        ability=data.get('ability', 0.0),
        standard_error=data.get('standard_error', 0.5),
        accuracy=data.get('accuracy', 0.5),
        attempts=data.get('attempts', 0),
        correct_count=data.get('correct_count', 0),
        xp_earned=data.get('xp_earned', 0),
        level=data.get('level', 1)
    )
    
    return jsonify({'status': 'updated'}), 200

# ============================================================================
# BADGES ENDPOINTS
# ============================================================================

@db_api.route('/badges', methods=['POST'])
def award_badge():
    """Award a badge to student"""
    data = request.json
    badge_id = str(uuid.uuid4())
    
    success = db.award_badge(
        badge_id=badge_id,
        student_id=data.get('student_id'),
        badge_type=data.get('badge_type'),
        badge_name=data.get('badge_name')
    )
    
    if success:
        return jsonify({'badge_id': badge_id, 'status': 'awarded'}), 201
    else:
        return jsonify({'error': 'Failed to award badge'}), 400

@db_api.route('/badges/<student_id>', methods=['GET'])
def get_badges(student_id):
    """Get all badges for student"""
    badges = db.get_badges(student_id)
    return jsonify({'badges': badges}), 200

# ============================================================================
# HEALTH CHECK
# ============================================================================

@db_api.route('/health', methods=['GET'])
def db_health():
    """Database health check"""
    try:
        # Try to connect and query
        db.connect()
        db.close()
        return jsonify({'status': 'operational', 'database': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
