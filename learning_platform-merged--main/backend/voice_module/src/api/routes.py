"""
REST API Routes for ML Backend
Endpoints for emotion detection, NLU, audio processing, and IRT
"""

from flask import request, jsonify
import logging
import os
import base64
import io
import numpy as np
from werkzeug.exceptions import BadRequest

logger = logging.getLogger(__name__)


def register_routes(app):
    """
    Register all API routes to Flask app
    
    Args:
        app: Flask application instance
    """
    
    # ==================== HEALTH CHECK ====================
    @app.route('/api/health', methods=['GET'])
    def api_health():
        """API health check"""
        return jsonify({
            'status': 'operational',
            'components': {
                'audio': 'ready',
                'emotion': 'ready',
                'nlu': 'ready',
                'irt': 'ready'
            }
        }), 200
    
    # ==================== EMOTION DETECTION ====================
    @app.route('/api/emotion/analyze', methods=['POST'])
    def analyze_emotion():
        """
        Analyze emotion from audio file or features
        
        Request format:
        - Multipart: 'audio' file
        - JSON: {'audio_base64': '...', 'features': {...}}
        
        Response:
        {
            'emotion': {
                'confidence': 0.8,
                'frustration': 0.3,
                'engagement': 0.7,
                'dominant_emotion': 'engaged'
            }
        }
        """
        try:
            # Get audio data
            audio_data = None
            sample_rate = 16000
            
            # Check for file upload
            if 'audio' in request.files:
                audio_file = request.files['audio']
                audio_bytes = audio_file.read()
                
                # Load audio using audio processor
                import soundfile as sf
                audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))
                
                logger.info(f"Received audio file: {audio_file.filename}")
            
            # Check for base64 encoded audio
            elif request.json and 'audio_base64' in request.json:
                audio_base64 = request.json['audio_base64']
                audio_bytes = base64.b64decode(audio_base64)
                
                import soundfile as sf
                audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))
            
            # Check for pre-extracted features
            elif request.json and 'features' in request.json:
                features = request.json['features']
                emotion_result = app.emotion_classifier.classify(features)
                
                return jsonify({
                    'status': 'success',
                    'emotion': emotion_result
                }), 200
            
            if audio_data is None:
                return jsonify({
                    'status': 'error',
                    'message': 'No audio data provided'
                }), 400
            
            # Extract features
            features = app.audio_processor.extract_features(audio_data, sample_rate)
            
            # Classify emotion
            emotion_result = app.emotion_classifier.classify(features)
            
            return jsonify({
                'status': 'success',
                'emotion': emotion_result
            }), 200
        
        except Exception as e:
            logger.error(f"Error in emotion analysis: {e}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    # ==================== NLU - INTENT RECOGNITION ====================
    @app.route('/api/nlu/intent', methods=['POST'])
    def recognize_intent():
        """
        Recognize learning intent from user text
        
        Request format:
        {
            'text': 'User input text',
            'context': {
                'question_type': 'numeric',
                'activity': 'counting-adventure'
            }
        }
        
        Response:
        {
            'intent': 'answer_numeric',
            'confidence': 0.9,
            'entities': {'number': ['5']},
            'validation': {'is_valid': true}
        }
        """
        try:
            data = request.json
            
            if not data or 'text' not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'Text required'
                }), 400
            
            text = data['text']
            context = data.get('context')
            
            # Recognize intent
            intent_result = app.intent_recognizer.recognize_intent(text, context)
            
            # Add validation based on intent
            validation = {
                'is_valid': intent_result['confidence'] > 0.3,
                'confidence': intent_result['confidence']
            }
            
            # Extract specific answer if intent is answer_* type
            if 'answer' in intent_result['intent']:
                if intent_result['intent'] == 'answer_numeric':
                    extracted = app.intent_recognizer.extract_numeric_answer(text)
                    validation['extracted_value'] = extracted
                elif intent_result['intent'] == 'answer_text':
                    extracted = app.intent_recognizer.extract_text_answer(text)
                    validation['extracted_value'] = extracted
            
            return jsonify({
                'status': 'success',
                'intent': intent_result['intent'],
                'confidence': intent_result['confidence'],
                'entities': intent_result['entities'],
                'validation': validation,
                'original_text': text
            }), 200
        
        except Exception as e:
            logger.error(f"Error in intent recognition: {e}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @app.route('/api/nlu/validate-answer', methods=['POST'])
    def validate_answer():
        """
        Validate student answer against correct answer
        
        Request format:
        {
            'user_answer': 'five',
            'correct_answer': '5',
            'answer_type': 'numeric'
        }
        
        Response:
        {
            'is_correct': true,
            'similarity': 0.95,
            'feedback': 'Correct!'
        }
        """
        try:
            data = request.json
            
            required_fields = ['user_answer', 'correct_answer', 'answer_type']
            if not all(field in data for field in required_fields):
                return jsonify({
                    'status': 'error',
                    'message': 'Missing required fields'
                }), 400
            
            user_answer = data['user_answer']
            correct_answer = data['correct_answer']
            answer_type = data['answer_type']
            threshold = data.get('threshold', 0.8)
            
            # Validate answer
            is_correct = app.intent_recognizer.validate_answer(
                user_answer, correct_answer, answer_type, threshold
            )
            
            # Calculate similarity
            similarity = app.intent_recognizer.calculate_similarity(
                user_answer, correct_answer
            )
            
            # Generate feedback
            if is_correct:
                feedback = "Correct! Well done!"
            elif similarity > 0.7:
                feedback = f"Close! The answer is '{correct_answer}'"
            else:
                feedback = f"Not quite. The correct answer is '{correct_answer}'"
            
            return jsonify({
                'status': 'success',
                'is_correct': is_correct,
                'similarity': similarity,
                'feedback': feedback
            }), 200
        
        except Exception as e:
            logger.error(f"Error validating answer: {e}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    # ==================== AUDIO PROCESSING ====================
    @app.route('/api/audio/features', methods=['POST'])
    def extract_audio_features():
        """
        Extract acoustic features from audio
        
        Request format:
        - Multipart: 'audio' file
        - JSON: {'audio_base64': '...'}
        
        Response:
        {
            'features': {
                'mfcc_mean': [...],
                'spectral_centroid_mean': 2000,
                'f0_mean': 150,
                ...
            }
        }
        """
        try:
            audio_data = None
            sample_rate = 16000
            
            # Get audio from file or base64
            if 'audio' in request.files:
                import soundfile as sf
                audio_file = request.files['audio']
                audio_bytes = audio_file.read()
                audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))
            
            elif request.json and 'audio_base64' in request.json:
                import soundfile as sf
                audio_base64 = request.json['audio_base64']
                audio_bytes = base64.b64decode(audio_base64)
                audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))
            
            if audio_data is None:
                return jsonify({
                    'status': 'error',
                    'message': 'No audio data'
                }), 400
            
            # Extract features
            features = app.audio_processor.extract_features(audio_data, sample_rate)
            
            # Convert numpy arrays to lists for JSON
            features_json = {}
            for key, value in features.items():
                if isinstance(value, np.ndarray):
                    features_json[key] = value.tolist()
                else:
                    features_json[key] = float(value) if isinstance(value, (int, float)) else value
            
            return jsonify({
                'status': 'success',
                'features': features_json
            }), 200
        
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    # ==================== IRT MODEL ====================
    @app.route('/api/irt/evaluate', methods=['POST'])
    def evaluate_response():
        """
        Evaluate student response and update ability estimate
        
        Request format:
        {
            'student_id': 'student_123',
            'item_id': 'item_456',
            'is_correct': true,
            'item_params': {
                'difficulty': 0.5,
                'discrimination': 1.2,
                'guessing': 0.2
            },
            'response_time': 5.2
        }
        
        Response:
        {
            'ability': 0.45,
            'standard_error': 0.8,
            'accuracy': 0.8,
            'performance_trend': 'improving'
        }
        """
        try:
            data = request.json
            
            required_fields = ['student_id', 'item_id', 'is_correct', 'item_params']
            if not all(field in data for field in required_fields):
                return jsonify({
                    'status': 'error',
                    'message': 'Missing required fields'
                }), 400
            
            from src.models.irt_model import ItemParameters
            
            student_id = data['student_id']
            item_id = data['item_id']
            is_correct = data['is_correct']
            item_params_data = data['item_params']
            response_time = data.get('response_time')
            
            # Create item parameters object
            item_params = ItemParameters(
                item_id=item_id,
                difficulty=item_params_data.get('difficulty', 0.0),
                discrimination=item_params_data.get('discrimination', 1.0),
                guessing=item_params_data.get('guessing', 0.2)
            )
            
            # Evaluate response
            student_ability = app.irt_model.evaluate_response(
                student_id, item_id, is_correct, item_params, response_time
            )
            
            # Get statistics
            stats = app.irt_model.get_statistics(student_id)
            
            return jsonify({
                'status': 'success',
                'ability': student_ability.ability,
                'standard_error': student_ability.standard_error,
                'accuracy': stats['accuracy'],
                'performance_trend': stats['performance_trend']
            }), 200
        
        except Exception as e:
            logger.error(f"Error evaluating response: {e}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @app.route('/api/irt/next-item', methods=['POST'])
    def get_next_item():
        """
        Get next item based on student ability
        
        Request format:
        {
            'student_id': 'student_123',
            'item_bank': [
                {
                    'item_id': 'item_1',
                    'difficulty': 0.2,
                    'discrimination': 1.0,
                    'guessing': 0.2
                },
                ...
            ],
            'strategy': 'mfi'
        }
        
        Response:
        {
            'item': {...},
            'recommended_difficulty': 0.45
        }
        """
        try:
            data = request.json
            
            if 'student_id' not in data or 'item_bank' not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'Missing student_id or item_bank'
                }), 400
            
            from src.models.irt_model import ItemParameters
            
            student_id = data['student_id']
            item_bank_data = data['item_bank']
            strategy = data.get('strategy', 'mfi')
            
            # Convert to ItemParameters objects
            item_bank = [
                ItemParameters(
                    item_id=item.get('item_id'),
                    difficulty=item.get('difficulty', 0.0),
                    discrimination=item.get('discrimination', 1.0),
                    guessing=item.get('guessing', 0.2),
                    name=item.get('name', '')
                )
                for item in item_bank_data
            ]
            
            # Select next item
            next_item = app.irt_model.select_next_item(student_id, item_bank, strategy)
            
            # Get recommended difficulty
            recommended_difficulty = app.irt_model.get_recommended_difficulty(student_id)
            
            return jsonify({
                'status': 'success',
                'item': {
                    'item_id': next_item.item_id,
                    'difficulty': next_item.difficulty,
                    'discrimination': next_item.discrimination,
                    'guessing': next_item.guessing,
                    'name': next_item.name
                },
                'recommended_difficulty': recommended_difficulty
            }), 200
        
        except Exception as e:
            logger.error(f"Error getting next item: {e}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @app.route('/api/irt/statistics/<student_id>', methods=['GET'])
    def get_irt_statistics(student_id):
        """
        Get IRT statistics for a student
        
        Response:
        {
            'ability': 0.45,
            'standard_error': 0.8,
            'items_attempted': 10,
            'accuracy': 0.8,
            'performance_trend': 'improving'
        }
        """
        try:
            stats = app.irt_model.get_statistics(student_id)
            
            return jsonify({
                'status': 'success',
                'statistics': stats
            }), 200
        
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    # ==================== COMBINED ANALYSIS ====================
    @app.route('/api/analyze/complete', methods=['POST'])
    def complete_analysis():
        """
        Complete analysis pipeline
        - Emotion detection
        - NLU intent recognition
        - Answer validation
        - IRT update
        
        Request format:
        {
            'student_id': 'student_123',
            'audio_base64': '...',
            'user_text': 'five',
            'item_id': 'item_456',
            'correct_answer': '5',
            'answer_type': 'numeric',
            'item_params': {...}
        }
        """
        try:
            data = request.json
            
            results = {
                'emotion': None,
                'intent': None,
                'validation': None,
                'ability': None
            }
            
            # 1. Emotion analysis
            if 'audio_base64' in data:
                import soundfile as sf
                audio_base64 = data['audio_base64']
                audio_bytes = base64.b64decode(audio_base64)
                audio_data, sr = sf.read(io.BytesIO(audio_bytes))
                features = app.audio_processor.extract_features(audio_data, sr)
                emotion = app.emotion_classifier.classify(features)
                results['emotion'] = emotion
            
            # 2. Intent recognition
            if 'user_text' in data:
                intent = app.intent_recognizer.recognize_intent(
                    data['user_text'],
                    data.get('context')
                )
                results['intent'] = intent
            
            # 3. Answer validation
            if all(k in data for k in ['user_text', 'correct_answer', 'answer_type']):
                is_correct = app.intent_recognizer.validate_answer(
                    data['user_text'],
                    data['correct_answer'],
                    data['answer_type']
                )
                similarity = app.intent_recognizer.calculate_similarity(
                    data['user_text'],
                    data['correct_answer']
                )
                results['validation'] = {
                    'is_correct': is_correct,
                    'similarity': similarity
                }
            
            # 4. IRT update
            if all(k in data for k in ['student_id', 'item_id', 'item_params']):
                from src.models.irt_model import ItemParameters
                
                item_params_data = data['item_params']
                item_params = ItemParameters(
                    item_id=data['item_id'],
                    difficulty=item_params_data.get('difficulty'),
                    discrimination=item_params_data.get('discrimination'),
                    guessing=item_params_data.get('guessing')
                )
                
                is_correct = results.get('validation', {}).get('is_correct', False)
                
                student = app.irt_model.evaluate_response(
                    data['student_id'],
                    data['item_id'],
                    is_correct,
                    item_params,
                    data.get('response_time')
                )
                
                results['ability'] = {
                    'ability': student.ability,
                    'standard_error': student.standard_error
                }
            
            return jsonify({
                'status': 'success',
                'results': results
            }), 200
        
        except Exception as e:
            logger.error(f"Error in complete analysis: {e}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    logger.info("All API routes registered successfully")
