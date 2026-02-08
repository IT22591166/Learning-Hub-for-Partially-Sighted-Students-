"""
Advanced Audio Processing Module
Feature extraction and signal processing for emotion detection
"""

import numpy as np
import librosa
import soundfile as sf
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class AudioProcessor:
    """
    Advanced audio processing for acoustic feature extraction
    Handles feature extraction, normalization, and preprocessing
    """
    
    def __init__(self, sample_rate: int = 16000):
        """
        Initialize audio processor
        
        Args:
            sample_rate: Audio sample rate (default: 16000 Hz)
        """
        self.sample_rate = sample_rate
        self.n_mfcc = 13
        self.n_fft = 2048
        self.hop_length = 512
        
    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """
        Load audio file
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Tuple of (audio array, sample rate)
        """
        try:
            audio, sr = librosa.load(file_path, sr=self.sample_rate)
            logger.info(f"Loaded audio from {file_path} (sr={sr}, duration={len(audio)/sr:.2f}s)")
            return audio, sr
        except Exception as e:
            logger.error(f"Error loading audio: {e}")
            raise
    
    def extract_features(self, audio: np.ndarray, sr: int = None) -> Dict[str, np.ndarray]:
        """
        Extract comprehensive acoustic features from audio
        
        Args:
            audio: Audio time series
            sr: Sample rate (uses self.sample_rate if None)
            
        Returns:
            Dictionary of extracted features
        """
        if sr is None:
            sr = self.sample_rate
        
        features = {}
        
        # 1. MFCC (Mel-Frequency Cepstral Coefficients)
        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=self.n_mfcc)
        features['mfcc'] = mfcc
        features['mfcc_mean'] = np.mean(mfcc, axis=1)
        features['mfcc_std'] = np.std(mfcc, axis=1)
        
        # 2. Mel Spectrogram
        mel_spec = librosa.feature.melspectrogram(y=audio, sr=sr)
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        features['mel_spectrogram'] = mel_spec_db
        features['mel_spec_mean'] = np.mean(mel_spec_db, axis=1)
        
        # 3. Spectral Features
        spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
        features['spectral_centroid'] = spectral_centroid
        features['spectral_centroid_mean'] = np.mean(spectral_centroid)
        features['spectral_centroid_std'] = np.std(spectral_centroid)
        
        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
        features['spectral_rolloff'] = spectral_rolloff
        features['spectral_rolloff_mean'] = np.mean(spectral_rolloff)
        
        # 4. Zero Crossing Rate (ZCR)
        zcr = librosa.feature.zero_crossing_rate(audio)[0]
        features['zcr'] = zcr
        features['zcr_mean'] = np.mean(zcr)
        features['zcr_std'] = np.std(zcr)
        
        # 5. Energy (RMS)
        rms = librosa.feature.rms(y=audio)[0]
        features['rms'] = rms
        features['rms_mean'] = np.mean(rms)
        features['rms_std'] = np.std(rms)
        features['rms_energy_db'] = 20 * np.log10(np.max(features['rms_mean'], 1e-10))
        
        # 6. Pitch (Fundamental Frequency)
        f0 = self.estimate_pitch(audio, sr)
        features['f0'] = f0
        features['f0_mean'] = np.mean(f0[f0 > 0]) if np.any(f0 > 0) else 0
        features['f0_std'] = np.std(f0[f0 > 0]) if np.any(f0 > 0) else 0
        
        # 7. Chroma Features
        chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
        features['chroma'] = chroma
        features['chroma_mean'] = np.mean(chroma, axis=1)
        
        # 8. Temporal Features
        features['duration'] = len(audio) / sr
        features['speech_rate'] = self.estimate_speech_rate(audio, sr)
        
        # 9. Temporal Derivative Features
        delta_mfcc = librosa.feature.delta(mfcc)
        features['delta_mfcc_mean'] = np.mean(delta_mfcc, axis=1)
        
        return features
    
    def estimate_pitch(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Estimate fundamental frequency using harmonic-percussive separation
        
        Args:
            audio: Audio time series
            sr: Sample rate
            
        Returns:
            Array of estimated pitches
        """
        try:
            # Harmonic-percussive separation
            S = librosa.stft(audio)
            H, P = librosa.decompose.hpss(S)
            
            # Estimate f0 from harmonic component
            f0 = librosa.yin(audio, fmin=80, fmax=400, sr=sr)
            return f0
        except Exception as e:
            logger.warning(f"Pitch estimation failed: {e}")
            return np.zeros(len(audio) // self.hop_length)
    
    def estimate_speech_rate(self, audio: np.ndarray, sr: int) -> float:
        """
        Estimate speech rate in words per minute
        
        Args:
            audio: Audio time series
            sr: Sample rate
            
        Returns:
            Estimated speech rate (WPM)
        """
        try:
            # Detect speech activity using energy
            rms = librosa.feature.rms(y=audio)[0]
            threshold = np.mean(rms) * 0.5
            speech_frames = np.sum(rms > threshold)
            
            # Estimate syllables (rough approximation)
            onset_env = librosa.onset.onset_strength(y=audio, sr=sr)
            peaks = librosa.util.peak_pick(onset_env, pre_max=3, post_max=3, 
                                          pre_avg=3, post_avg=3, delta=0.5, wait=10)
            
            # Convert to words per minute (assuming ~4 syllables per word)
            duration = len(audio) / sr
            estimated_syllables = len(peaks)
            estimated_words = estimated_syllables / 4
            wpm = (estimated_words / duration) * 60 if duration > 0 else 0
            
            return min(wpm, 300)  # Cap at 300 WPM
        except Exception as e:
            logger.warning(f"Speech rate estimation failed: {e}")
            return 150.0
    
    def normalize_audio(self, audio: np.ndarray) -> np.ndarray:
        """
        Normalize audio to [-1, 1] range
        
        Args:
            audio: Audio time series
            
        Returns:
            Normalized audio
        """
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            return audio / max_val
        return audio
    
    def apply_emphasis_filter(self, audio: np.ndarray, coeff: float = 0.97) -> np.ndarray:
        """
        Apply pre-emphasis filter
        
        Args:
            audio: Audio time series
            coeff: Emphasis coefficient
            
        Returns:
            Filtered audio
        """
        emphasized = np.zeros_like(audio)
        emphasized[0] = audio[0]
        
        for i in range(1, len(audio)):
            emphasized[i] = audio[i] - coeff * audio[i-1]
        
        return emphasized
    
    def frame_audio(self, audio: np.ndarray, frame_length: int, 
                   hop_length: int) -> np.ndarray:
        """
        Frame audio signal
        
        Args:
            audio: Audio time series
            frame_length: Length of frame
            hop_length: Number of samples between frames
            
        Returns:
            Framed audio (n_frames, frame_length)
        """
        n_frames = 1 + (len(audio) - frame_length) // hop_length
        frames = np.zeros((n_frames, frame_length))
        
        for i in range(n_frames):
            start = i * hop_length
            frames[i] = audio[start:start + frame_length]
        
        return frames
    
    def save_audio(self, audio: np.ndarray, file_path: str, sr: int = None):
        """
        Save audio to file
        
        Args:
            audio: Audio time series
            file_path: Output file path
            sr: Sample rate
        """
        if sr is None:
            sr = self.sample_rate
        
        try:
            sf.write(file_path, audio, sr)
            logger.info(f"Audio saved to {file_path}")
        except Exception as e:
            logger.error(f"Error saving audio: {e}")
            raise


class VoiceActivityDetector:
    """
    Detect voice activity in audio (speech vs silence/noise)
    """
    
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
    
    def detect_voiced_frames(self, audio: np.ndarray, frame_length: int = 512,
                            hop_length: int = 128) -> np.ndarray:
        """
        Detect voiced (speech) frames using energy threshold
        
        Args:
            audio: Audio time series
            frame_length: Length of frame
            hop_length: Hop length between frames
            
        Returns:
            Boolean array indicating voiced frames
        """
        # Calculate energy for each frame
        rms = librosa.feature.rms(y=audio, frame_length=frame_length, 
                                  hop_length=hop_length)[0]
        
        # Use adaptive threshold
        threshold = np.mean(rms) + 0.5 * np.std(rms)
        voiced = rms > threshold
        
        return voiced
    
    def get_voice_segments(self, audio: np.ndarray, 
                          min_duration: float = 0.1) -> list:
        """
        Extract continuous voice segments
        
        Args:
            audio: Audio time series
            min_duration: Minimum segment duration in seconds
            
        Returns:
            List of (start, end) tuples for voice segments
        """
        voiced = self.detect_voiced_frames(audio)
        
        # Convert frame indices to sample indices
        hop_length = 128
        segments = []
        in_voice = False
        start = 0
        
        for i, frame_voiced in enumerate(voiced):
            if frame_voiced and not in_voice:
                start = i * hop_length
                in_voice = True
            elif not frame_voiced and in_voice:
                end = i * hop_length
                duration = (end - start) / self.sample_rate
                if duration >= min_duration:
                    segments.append((start, end))
                in_voice = False
        
        # Handle case where audio ends while voiced
        if in_voice:
            segments.append((start, len(audio)))
        
        return segments
