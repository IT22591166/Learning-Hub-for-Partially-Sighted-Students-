"""
Train Emotion Classification Models for Voice Learning
Creates real models to replace placeholder RandomForest classifiers
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import joblib
import os
from pathlib import Path

def generate_synthetic_training_data(n_samples=2000):
    """
    Generate synthetic training data for emotion classification
    In production, replace with real labeled audio feature data
    """
    np.random.seed(42)
    
    # Feature names matching audio_processor.py
    feature_names = [
        'pitch_mean', 'pitch_std', 'energy_mean', 'energy_std',
        'speech_rate', 'zero_crossing_rate', 'spectral_centroid',
        'mfcc_1', 'mfcc_2', 'mfcc_3', 'mfcc_4', 'mfcc_5',
        'pause_frequency', 'voice_tension'
    ]
    
    data = []
    
    for i in range(n_samples):
        # Simulate different emotional states
        emotion_type = np.random.choice(['calm', 'engaged', 'frustrated', 'confused'])
        
        if emotion_type == 'calm':
            # Low energy, stable pitch, moderate speech rate
            features = {
                'pitch_mean': np.random.normal(150, 20),
                'pitch_std': np.random.normal(15, 5),
                'energy_mean': np.random.normal(0.3, 0.1),
                'energy_std': np.random.normal(0.1, 0.02),
                'speech_rate': np.random.normal(3.5, 0.5),
                'zero_crossing_rate': np.random.normal(0.1, 0.02),
                'spectral_centroid': np.random.normal(2000, 300),
                'pause_frequency': np.random.normal(0.2, 0.05),
                'voice_tension': np.random.normal(0.3, 0.1)
            }
            # Labels: confidence=high, frustration=low, engagement=medium
            labels = {'confidence': 0.8, 'frustration': 0.2, 'engagement': 0.6}
            
        elif emotion_type == 'engaged':
            # Higher energy, varying pitch, faster speech
            features = {
                'pitch_mean': np.random.normal(160, 25),
                'pitch_std': np.random.normal(20, 8),
                'energy_mean': np.random.normal(0.6, 0.15),
                'energy_std': np.random.normal(0.15, 0.03),
                'speech_rate': np.random.normal(4.2, 0.6),
                'zero_crossing_rate': np.random.normal(0.12, 0.025),
                'spectral_centroid': np.random.normal(2200, 400),
                'pause_frequency': np.random.normal(0.15, 0.04),
                'voice_tension': np.random.normal(0.5, 0.12)
            }
            labels = {'confidence': 0.9, 'frustration': 0.1, 'engagement': 0.95}
            
        elif emotion_type == 'frustrated':
            # High energy, irregular pitch, tense voice
            features = {
                'pitch_mean': np.random.normal(170, 30),
                'pitch_std': np.random.normal(35, 12),
                'energy_mean': np.random.normal(0.8, 0.2),
                'energy_std': np.random.normal(0.25, 0.05),
                'speech_rate': np.random.normal(3.0, 0.8),  # Slower due to hesitation
                'zero_crossing_rate': np.random.normal(0.15, 0.03),
                'spectral_centroid': np.random.normal(2500, 500),
                'pause_frequency': np.random.normal(0.35, 0.1),  # More pauses
                'voice_tension': np.random.normal(0.8, 0.15)
            }
            labels = {'confidence': 0.3, 'frustration': 0.9, 'engagement': 0.4}
            
        else:  # confused
            # Moderate energy, hesitant speech, many pauses
            features = {
                'pitch_mean': np.random.normal(145, 15),
                'pitch_std': np.random.normal(25, 10),
                'energy_mean': np.random.normal(0.4, 0.1),
                'energy_std': np.random.normal(0.12, 0.02),
                'speech_rate': np.random.normal(2.8, 0.5),
                'zero_crossing_rate': np.random.normal(0.11, 0.02),
                'spectral_centroid': np.random.normal(1900, 300),
                'pause_frequency': np.random.normal(0.4, 0.08),
                'voice_tension': np.random.normal(0.4, 0.1)
            }
            labels = {'confidence': 0.4, 'frustration': 0.6, 'engagement': 0.3}
        
        # Add MFCCs (simplified)
        for j in range(1, 6):
            features[f'mfcc_{j}'] = np.random.normal(0, 1)
        
        # Create feature vector
        feature_vector = [features[name] for name in feature_names]
        
        data.append({
            'features': feature_vector,
            'confidence': labels['confidence'],
            'frustration': labels['frustration'],
            'engagement': labels['engagement'],
            'emotion_type': emotion_type
        })
    
    return data, feature_names

def train_emotion_models():
    """Train and save emotion classification models"""
    print("🔧 Generating synthetic training data...")
    data, feature_names = generate_synthetic_training_data(2000)
    
    # Convert to arrays
    X = np.array([item['features'] for item in data])
    y_confidence = np.array([item['confidence'] for item in data])
    y_frustration = np.array([item['frustration'] for item in data])
    y_engagement = np.array([item['engagement'] for item in data])
    
    # Split data
    X_train, X_test, y_conf_train, y_conf_test = train_test_split(
        X, y_confidence, test_size=0.2, random_state=42
    )
    _, _, y_frust_train, y_frust_test = train_test_split(
        X, y_frustration, test_size=0.2, random_state=42
    )
    _, _, y_eng_train, y_eng_test = train_test_split(
        X, y_engagement, test_size=0.2, random_state=42
    )
    
    # Scale features
    confidence_scaler = StandardScaler()
    frustration_scaler = StandardScaler()
    engagement_scaler = StandardScaler()
    
    X_train_conf = confidence_scaler.fit_transform(X_train)
    X_test_conf = confidence_scaler.transform(X_test)
    
    X_train_frust = frustration_scaler.fit_transform(X_train)
    X_test_frust = frustration_scaler.transform(X_test)
    
    X_train_eng = engagement_scaler.fit_transform(X_train)
    X_test_eng = engagement_scaler.transform(X_test)
    
    print("🤖 Training emotion models...")
    
    # Train models
    confidence_model = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42)
    frustration_model = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42)
    engagement_model = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42)
    
    # Convert continuous targets to discrete classes for classification
    confidence_model.fit(X_train_conf, (y_conf_train > 0.5).astype(int))
    frustration_model.fit(X_train_frust, (y_frust_train > 0.5).astype(int))
    engagement_model.fit(X_train_eng, (y_eng_train > 0.5).astype(int))
    
    # Evaluate
    conf_pred = confidence_model.predict(X_test_conf)
    frust_pred = frustration_model.predict(X_test_frust)
    eng_pred = engagement_model.predict(X_test_eng)
    
    print("✅ Model Training Complete!")
    print(f"Confidence Model Accuracy: {np.mean(conf_pred == (y_conf_test > 0.5).astype(int)):.3f}")
    print(f"Frustration Model Accuracy: {np.mean(frust_pred == (y_frust_test > 0.5).astype(int)):.3f}")
    print(f"Engagement Model Accuracy: {np.mean(eng_pred == (y_eng_test > 0.5).astype(int)):.3f}")
    
    # Save models
    model_dir = Path("models")
    model_dir.mkdir(exist_ok=True)
    
    model_data = {
        'confidence_model': confidence_model,
        'frustration_model': frustration_model,
        'engagement_model': engagement_model,
        'confidence_scaler': confidence_scaler,
        'frustration_scaler': frustration_scaler,
        'engagement_scaler': engagement_scaler,
        'feature_names': feature_names,
        'version': '1.0.0'
    }
    
    model_path = model_dir / 'emotion_model.pkl'
    joblib.dump(model_data, model_path)
    print(f"💾 Models saved to: {model_path}")
    
    return model_path

if __name__ == '__main__':
    model_path = train_emotion_models()
    print(f"🎉 Training complete! Set environment variable: EMOTION_MODEL_PATH={model_path}")