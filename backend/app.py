"""
Unified Flask Backend - Learning Hub for Partially Sighted Students
Merges:
  - SciBot (IT22557124): Grade 7 Science Q&A chatbot
  - Voice Learning Module (IT22255938): Emotion detection, NLU, IRT adaptive learning
  - Smart Glove (IT22563514): Haptic feedback settings (frontend-only)
  - Learning Hub Shell (IT22591166): Main platform UI
"""

import os
import sys
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config['JSON_SORT_KEYS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

    # ==================== HEALTH CHECK ====================
    @app.route('/')
    def home():
        return jsonify({
            "message": "Welcome to the Learning Hub API",
            "modules": {
                "scibot": "/api/scibot/ask",
                "voice_module": "/api/voice/*",
                "smart_glove": "/api/smart-glove/*",
                "health": "/api/health"
            }
        })

    @app.route('/api/health')
    def health_check():
        status = {
            "status": "healthy",
            "modules": {}
        }

        # Check SciBot
        try:
            from scibot.engine import _initialized as scibot_ready
            status["modules"]["scibot"] = "ready" if scibot_ready else "not_initialized"
        except Exception as e:
            status["modules"]["scibot"] = f"error: {e}"

        # Check Voice Module
        try:
            if hasattr(app, 'irt_model') and app.irt_model:
                status["modules"]["voice_module"] = "ready"
            else:
                status["modules"]["voice_module"] = "not_initialized"
        except Exception:
            status["modules"]["voice_module"] = "not_available"

        # Check Smart Glove Module
        try:
            from smart_glove.ble_manager import get_ble_manager
            ble = get_ble_manager()
            status["modules"]["smart_glove"] = "connected" if ble.is_connected else "ready"
        except ImportError:
            status["modules"]["smart_glove"] = "not_available (install bleak)"
        except Exception as e:
            status["modules"]["smart_glove"] = f"error: {e}"

        return jsonify(status)

    @app.route('/health')
    def health_check_alias():
        """Alias for /api/health - needed by voice activities frontend"""
        return health_check()

    # ==================== SCIBOT MODULE ====================
    try:
        from scibot.engine import initialize as scibot_init, answer_question
        logger.info("Initializing SciBot module...")
        scibot_init()

        @app.route('/api/scibot/ask', methods=['POST'])
        def scibot_ask():
            data = request.get_json() or {}
            question = data.get("question", "")
            try:
                answer = answer_question(question)
                return jsonify({"answer": answer})
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        logger.info("✅ SciBot module loaded")
    except Exception as e:
        logger.warning(f"⚠ SciBot module not available: {e}")

        @app.route('/api/scibot/ask', methods=['POST'])
        def scibot_ask_fallback():
            return jsonify({"error": "SciBot module is not available. Check dependencies."}), 503

    # ==================== SMART GLOVE MODULE ====================
    try:
        from smart_glove.routes import register_smart_glove_routes
        register_smart_glove_routes(app)
        logger.info("✅ Smart Glove BLE module loaded")
    except ImportError as e:
        logger.warning(f"⚠ Smart Glove module not available (install 'bleak' for BLE support): {e}")
    except Exception as e:
        logger.warning(f"⚠ Smart Glove module error: {e}")

    # ==================== VOICE MODULE ====================
    try:
        from voice_module.voice_routes import register_voice_routes
        register_voice_routes(app)
        logger.info("✅ Voice module loaded")
    except Exception as e:
        logger.warning(f"⚠ Voice module not available: {e}")

    # ==================== VOICE ACTIVITIES (Static serving for iframe) ====================
    VOICE_ACTIVITIES_DIR = os.path.join(os.path.dirname(__file__), 'voice_activities')

    @app.route('/voice-activities/')
    @app.route('/voice-activities/<path:filename>')
    def serve_voice_activities(filename='index.html'):
        return send_from_directory(VOICE_ACTIVITIES_DIR, filename)

    # ==================== ERROR HANDLERS ====================
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found', 'message': str(error)}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal error: {error}")
        return jsonify({'error': 'Internal server error'}), 500

    logger.info("🚀 Unified Learning Hub backend created successfully")
    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'true').lower() == 'true'
    logger.info(f"Starting server on port {port} (debug={debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)
