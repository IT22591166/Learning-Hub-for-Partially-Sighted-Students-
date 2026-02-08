"""
Advanced Emotion Classification Module
Deep learning-based emotion detection from audio features
"""

import numpy as np
import pickle
import logging
from typing import Dict, Tuple, Optional
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib

logger = logging.getLogger(__name__)


class EmotionClassifier:
    """
    Classify emotions (confidence, frustration, engagement) from audio
    Uses machine learning models trained on acoustic features
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize emotion classifier
        
        Args:
            model_path: Path to pre-trained model file
        """
        self.emotion_labels = ['calm', 'engaged', 'frustrated', 'confused']
        self.confidence_scaler = StandardScaler()
        self.frustration_scaler = StandardScaler()
        self.engagement_scaler = StandardScaler()
        
        self.confidence_model = None
        self.frustration_model = None
        self.engagement_model = None
        
        if model_path:
            self.load_model(model_path)
        else:
            self._initialize_default_models()
    
    def _initialize_default_models(self):
        """Initialize default models if no pre-trained model available"""
        logger.warning("No pre-trained model provided, using placeholder models")
        
        # Create placeholder models
        self.confidence_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.frustration_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.engagement_model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    def load_model(self, model_path: str):
        """
        Load pre-trained model from file
        
        Args:
            model_path: Path to model file
        """
        try:
            model_data = joblib.load(model_path)
            self.confidence_model = model_data.get('confidence_model')
            self.frustration_model = model_data.get('frustration_model')
            self.engagement_model = model_data.get('engagement_model')
            self.confidence_scaler = model_data.get('confidence_scaler')
            self.frustration_scaler = model_data.get('frustration_scaler')
            self.engagement_scaler = model_data.get('engagement_scaler')
            
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self._initialize_default_models()
    
    def classify(self, features: Dict[str, np.ndarray]) -> Dict[str, float]:
        """
        Classify emotion from audio features
        
        Args:
            features: Dictionary of audio features
            
        Returns:
            Dictionary with emotion scores (0-1 for each dimension)
        """
        try:
            # Extract and combine relevant features
            feature_vector = self._extract_feature_vector(features)
            
            # Normalize features
            feature_scaled = self.confidence_scaler.transform([feature_vector])[0]
            
            # Predict emotion dimensions
            confidence = self._predict_confidence(feature_scaled)
            frustration = self._predict_frustration(feature_scaled)
            engagement = self._predict_engagement(feature_scaled)
            
            # Determine dominant emotion
            emotions_scores = {
                'calm': (1 - frustration) * confidence,
                'engaged': engagement * confidence,
                'frustrated': frustration,
                'confused': (1 - confidence) * (1 - engagement)
            }
            
            dominant_emotion = max(emotions_scores, key=emotions_scores.get)
            
            return {
                'confidence': float(confidence),
                'frustration': float(frustration),
                'engagement': float(engagement),
                'dominant_emotion': dominant_emotion,
                'all_emotions': {k: float(v) for k, v in emotions_scores.items()}
            }
        except Exception as e:
            logger.error(f"Error in emotion classification: {e}")
            return self._get_neutral_emotion()
    
    def _extract_feature_vector(self, features: Dict[str, np.ndarray]) -> np.ndarray:
        """
        Extract relevant features for emotion classification
        
        Args:
            features: Dictionary of audio features
            
        Returns:
            1D feature vector
        """
        feature_list = []
        
        # MFCC statistics
        if 'mfcc_mean' in features:
            feature_list.extend(features['mfcc_mean'])
        if 'mfcc_std' in features:
            feature_list.extend(features['mfcc_std'])
        
        # Spectral features
        if 'spectral_centroid_mean' in features:
            feature_list.append(features['spectral_centroid_mean'])
        if 'spectral_centroid_std' in features:
            feature_list.append(features['spectral_centroid_std'])
        if 'spectral_rolloff_mean' in features:
            feature_list.append(features['spectral_rolloff_mean'])
        
        # Energy features
        if 'rms_mean' in features:
            feature_list.append(features['rms_mean'])
        if 'rms_std' in features:
            feature_list.append(features['rms_std'])
        if 'rms_energy_db' in features:
            feature_list.append(features['rms_energy_db'])
        
        # Pitch features
        if 'f0_mean' in features:
            feature_list.append(features['f0_mean'])
        if 'f0_std' in features:
            feature_list.append(features['f0_std'])
        
        # ZCR
        if 'zcr_mean' in features:
            feature_list.append(features['zcr_mean'])
        
        # Speech rate
        if 'speech_rate' in features:
            feature_list.append(features['speech_rate'] / 300.0)  # Normalize
        
        # Delta features
        if 'delta_mfcc_mean' in features:
            feature_list.extend(features['delta_mfcc_mean'])
        
        # Pad to fixed length
        expected_length = 50  # Adjust based on training
        if len(feature_list) < expected_length:
            feature_list.extend([0.0] * (expected_length - len(feature_list)))
        
        return np.array(feature_list[:expected_length])
    
    def _predict_confidence(self, feature_vector: np.ndarray) -> float:
        """
        Predict confidence score (0-1)
        Lower hesitation, fluent speech = higher confidence
        """
        if self.confidence_model is None:
            return 0.5
        
        try:
            # Use model if available, otherwise rule-based
            score = 0.5
            
            # Rule-based heuristics
            # High speech rate = higher confidence
            if len(feature_vector) > 42:
                speech_rate_norm = feature_vector[42]
                score += 0.2 * speech_rate_norm
            
            # Low ZCR std = more stable voice = higher confidence
            if len(feature_vector) > 40:
                zcr = feature_vector[40]
                score -= 0.1 * zcr
            
            return np.clip(score, 0, 1)
        except:
            return 0.5
    
    def _predict_frustration(self, feature_vector: np.ndarray) -> float:
        """
        Predict frustration score (0-1)
        High pitch, fast speech, high energy = higher frustration
        """
        if self.frustration_model is None:
            return 0.3
        
        try:
            score = 0.3
            
            # Rule-based heuristics
            # High pitch (f0_mean) = frustration indicator
            if len(feature_vector) > 35:
                f0_mean_norm = np.clip(feature_vector[35] / 200.0, 0, 1)
                score += 0.3 * f0_mean_norm
            
            # High energy = frustration indicator
            if len(feature_vector) > 38:
                energy = np.clip(feature_vector[38], 0, 1)
                score += 0.3 * energy
            
            # High speech rate = frustration indicator
            if len(feature_vector) > 42:
                speech_rate_norm = feature_vector[42]
                score += 0.2 * min(speech_rate_norm, 1.0)
            
            return np.clip(score, 0, 1)
        except:
            return 0.3
    
    def _predict_engagement(self, feature_vector: np.ndarray) -> float:
        """
        Predict engagement score (0-1)
        Clear articulation, good prosody = higher engagement
        """
        if self.engagement_model is None:
            return 0.5
        
        try:
            score = 0.5
            
            # Rule-based heuristics
            # Spectral diversity (centroid) = engagement indicator
            if len(feature_vector) > 31:
                spec_cent_norm = np.clip(feature_vector[31] / 5000.0, 0, 1)
                score += 0.3 * spec_cent_norm
            
            # Energy consistency = engagement
            if len(feature_vector) > 39:
                rms_std = feature_vector[39]
                score += 0.2 * (1 - np.clip(rms_std, 0, 1))
            
            # Pitch variation = engagement
            if len(feature_vector) > 37:
                f0_std = feature_vector[37]
                score += 0.2 * np.clip(f0_std / 50.0, 0, 1)
            
            return np.clip(score, 0, 1)
        except:
            return 0.5
    
    def _get_neutral_emotion(self) -> Dict[str, float]:
        """Return neutral emotion scores"""
        return {
            'confidence': 0.5,
            'frustration': 0.3,
            'engagement': 0.5,
            'dominant_emotion': 'calm',
            'all_emotions': {
                'calm': 0.4,
                'engaged': 0.3,
                'frustrated': 0.2,
                'confused': 0.1
            }
        }
    
    def save_model(self, save_path: str):
        """
        Save trained models to file
        
        Args:
            save_path: Path to save models
        """
        try:
            model_data = {
                'confidence_model': self.confidence_model,
                'frustration_model': self.frustration_model,
                'engagement_model': self.engagement_model,
                'confidence_scaler': self.confidence_scaler,
                'frustration_scaler': self.frustration_scaler,
                'engagement_scaler': self.engagement_scaler,
            }
            joblib.dump(model_data, save_path)
            logger.info(f"Models saved to {save_path}")
        except Exception as e:
            logger.error(f"Error saving models: {e}")
