"""
Voice Module Routes - Wraps Repo 3's ML backend API routes
for the unified Learning Hub backend.

Prefixes all endpoints with /api/voice/ namespace.
"""

import logging
import sys
import os

logger = logging.getLogger(__name__)

# Add the voice_module directory to path so its imports work
VOICE_MODULE_DIR = os.path.dirname(__file__)
if VOICE_MODULE_DIR not in sys.path:
    sys.path.insert(0, VOICE_MODULE_DIR)


def register_voice_routes(app):
    """Register all voice module API routes to the Flask app"""

    # Initialize ML components
    logger.info("Initializing Voice Module ML components...")

    # Audio processing (optional)
    try:
        from src.audio.audio_processor import AudioProcessor
        audio_processor = AudioProcessor()
        app.audio_processor = audio_processor
        logger.info("  ✓ Audio processor initialized")
    except ImportError as e:
        app.audio_processor = None
        logger.info(f"  ⚠ Audio processor disabled: {e}")

    # Emotion classification (optional)
    try:
        from src.emotion.emotion_classifier import EmotionClassifier
        emotion_classifier = EmotionClassifier(
            model_path=os.getenv('EMOTION_MODEL_PATH', 'models/emotion_model.pkl')
        )
        app.emotion_classifier = emotion_classifier
        logger.info("  ✓ Emotion classifier initialized")
    except ImportError as e:
        app.emotion_classifier = None
        logger.info(f"  ⚠ Emotion classifier disabled: {e}")

    # Intent recognition (optional)
    try:
        from src.nlu.intent_recognizer import IntentRecognizer
        intent_recognizer = IntentRecognizer()
        app.intent_recognizer = intent_recognizer
        logger.info("  ✓ Intent recognizer initialized")
    except ImportError as e:
        app.intent_recognizer = None
        logger.info(f"  ⚠ Intent recognizer disabled: {e}")

    # IRT model (required)
    try:
        from src.models.irt_model import IRTModel
        irt_model = IRTModel()
        app.irt_model = irt_model
        logger.info("  ✓ IRT model initialized")
    except Exception as e:
        app.irt_model = None
        logger.warning(f"  ⚠ IRT model failed: {e}")

    # Register the original routes from Repo 3
    try:
        from src.api.routes import register_routes
        register_routes(app)
        logger.info("  ✓ Voice module API routes registered")
    except Exception as e:
        logger.error(f"  ✗ Failed to register voice module routes: {e}")
        import traceback
        logger.error(traceback.format_exc())
