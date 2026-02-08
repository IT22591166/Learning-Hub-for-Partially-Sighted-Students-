"""
Natural Language Understanding Module
Intent recognition and entity extraction for learning interactions
"""

import numpy as np
import logging
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import re

logger = logging.getLogger(__name__)


class IntentRecognizer:
    """
    Recognize learning intents and extract relevant entities
    Uses pattern matching and simple NLU for children's speech
    """
    
    # Intent patterns for children's learning
    INTENT_PATTERNS = {
        'answer_numeric': {
            'patterns': [
                r'\b(\d+)\b',  # Plain numbers
                r'(zero|one|two|three|four|five|six|seven|eight|nine|ten)',
                r'(eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)',
            ],
            'keywords': ['is', 'equals', 'the answer', 'it is', 'answer'],
            'confidence_boost': 0.3
        },
        'answer_text': {
            'patterns': [
                r"(it's|it is) (\w+)",
                r"the (\w+) is",
                r"i (think|believe|say) (\w+)",
            ],
            'keywords': ['is', 'the', 'answer', 'called', 'named'],
            'confidence_boost': 0.2
        },
        'ask_for_help': {
            'patterns': [
                r'(help|stuck|don\'t know|cannot)',
                r'(again|repeat|say it again)',
            ],
            'keywords': ['help', 'stuck', 'again', 'repeat', 'don\'t', 'know'],
            'confidence_boost': 0.4
        },
        'request_hint': {
            'patterns': [
                r'(hint|clue|help|how)',
            ],
            'keywords': ['hint', 'clue', 'help', 'tell me', 'how'],
            'confidence_boost': 0.3
        },
        'confirm': {
            'patterns': [
                r'(yes|yep|yeah|yup|correct|right|sure)',
            ],
            'keywords': ['yes', 'yeah', 'correct', 'right', 'sure'],
            'confidence_boost': 0.5
        },
        'deny': {
            'patterns': [
                r'(no|nope|not|wrong|incorrect|nah)',
            ],
            'keywords': ['no', 'nope', 'wrong', 'not', 'nah'],
            'confidence_boost': 0.5
        },
        'request_repeat': {
            'patterns': [
                r'(what|say it again|repeat|huh|pardon)',
            ],
            'keywords': ['what', 'again', 'repeat', 'pardon', 'huh', 'say'],
            'confidence_boost': 0.3
        },
        'express_emotion': {
            'patterns': [
                r'(happy|sad|fun|boring|easy|hard|difficult)',
            ],
            'keywords': ['happy', 'sad', 'fun', 'boring', 'easy', 'hard', 'difficult'],
            'confidence_boost': 0.2
        }
    }
    
    # Entity types to extract
    ENTITY_PATTERNS = {
        'number': [
            r'\b(\d+)\b',
            r'\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)',
            r'\b(eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)',
        ],
        'color': [
            r'\b(red|blue|green|yellow|orange|purple|pink|black|white|brown)\b',
        ],
        'object': [
            r'\b(apple|ball|cat|dog|house|tree|flower|bird|fish|car)\b',
        ],
        'action': [
            r'\b(go|run|jump|sit|sleep|eat|drink|play|sing|dance)\b',
        ]
    }
    
    def __init__(self):
        """Initialize intent recognizer"""
        self.learned_patterns = defaultdict(list)
        self.entity_cache = {}
    
    def recognize_intent(self, text: str, context: Optional[Dict] = None) -> Dict[str, any]:
        """
        Recognize intent from user text
        
        Args:
            text: User input text (typically from speech recognition)
            context: Optional context about current activity/question
            
        Returns:
            Dictionary with intent, confidence, and extracted entities
        """
        if not text or not isinstance(text, str):
            return self._get_no_intent()
        
        text_lower = text.lower().strip()
        
        # Initialize intent scores
        intent_scores = {intent: 0.0 for intent in self.INTENT_PATTERNS.keys()}
        
        # Score each intent
        for intent, config in self.INTENT_PATTERNS.items():
            score = 0.0
            pattern_matches = 0
            
            # Check patterns
            for pattern in config['patterns']:
                try:
                    if re.search(pattern, text_lower, re.IGNORECASE):
                        score += 0.3
                        pattern_matches += 1
                except:
                    pass
            
            # Check keywords
            keyword_matches = sum(1 for keyword in config['keywords'] 
                                 if keyword in text_lower)
            if keyword_matches > 0:
                score += min(0.4, keyword_matches * 0.15)
            
            # Boost confidence if patterns were found
            if pattern_matches > 0:
                score += config['confidence_boost']
            
            intent_scores[intent] = min(score, 1.0)
        
        # Determine top intent
        top_intent = max(intent_scores, key=intent_scores.get)
        confidence = intent_scores[top_intent]
        
        # Extract entities
        entities = self.extract_entities(text)
        
        # Context-based adjustments
        if context:
            confidence = self._adjust_confidence_by_context(
                top_intent, confidence, text, context
            )
        
        return {
            'intent': top_intent,
            'confidence': float(confidence),
            'entities': entities,
            'original_text': text,
            'intent_scores': {k: float(v) for k, v in intent_scores.items()}
        }
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract named entities and values from text
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of entity type to list of values
        """
        entities = defaultdict(list)
        text_lower = text.lower()
        
        for entity_type, patterns in self.ENTITY_PATTERNS.items():
            for pattern in patterns:
                try:
                    matches = re.findall(pattern, text_lower)
                    entities[entity_type].extend(matches)
                except:
                    pass
        
        # Remove duplicates
        for entity_type in entities:
            entities[entity_type] = list(set(entities[entity_type]))
        
        return dict(entities)
    
    def extract_numeric_answer(self, text: str) -> Optional[str]:
        """
        Extract numeric answer from text
        
        Args:
            text: User input
            
        Returns:
            Extracted number as string or None
        """
        # Try to find numeric value
        numeric_patterns = [
            r'\b(\d+)\b',
            r'\b(zero)\b',
            r'\b(one)\b',
            r'\b(two)\b',
            r'\b(three)\b',
            r'\b(four)\b',
            r'\b(five)\b',
            r'\b(six)\b',
            r'\b(seven)\b',
            r'\b(eight)\b',
            r'\b(nine)\b',
            r'\b(ten)\b',
        ]
        
        for pattern in numeric_patterns:
            match = re.search(pattern, text.lower())
            if match:
                return match.group(1)
        
        return None
    
    def extract_text_answer(self, text: str) -> Optional[str]:
        """
        Extract text answer from user input
        
        Args:
            text: User input
            
        Returns:
            Extracted answer text or None
        """
        # Common answer patterns
        patterns = [
            r"(?:it's|it is|the answer is) ([a-z\s]+?)(?:\.|,|$)",
            r"(?:i think|i believe) ([a-z\s]+?)(?:\.|,|$)",
            r"(?:the )?(\w+) is (\w+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                # Get the last captured group
                groups = match.groups()
                if groups:
                    return ' '.join(groups[-1:]).strip()
        
        return None
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate string similarity (Levenshtein distance normalized)
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score (0-1)
        """
        text1 = text1.lower().strip()
        text2 = text2.lower().strip()
        
        if text1 == text2:
            return 1.0
        
        # Calculate Levenshtein distance
        max_len = max(len(text1), len(text2))
        if max_len == 0:
            return 1.0
        
        distance = self._levenshtein_distance(text1, text2)
        similarity = 1.0 - (distance / max_len)
        
        return float(similarity)
    
    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        """Calculate Levenshtein distance between two strings"""
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                # j+1 instead of j since previous_row and current_row are one character longer
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            
            previous_row = current_row
        
        return previous_row[-1]
    
    def validate_answer(self, user_text: str, correct_answer: str, 
                       answer_type: str = 'text', threshold: float = 0.8) -> bool:
        """
        Validate user answer against correct answer
        
        Args:
            user_text: User's answer text
            correct_answer: Correct answer
            answer_type: 'numeric' or 'text'
            threshold: Similarity threshold for acceptance
            
        Returns:
            True if answer is correct
        """
        if answer_type == 'numeric':
            # Extract numeric answer
            extracted = self.extract_numeric_answer(user_text)
            if extracted:
                # Convert word numbers to digits
                extracted_value = self._word_to_number(extracted)
                correct_value = self._word_to_number(correct_answer)
                return extracted_value == correct_value
            return False
        
        else:  # text answer
            # Calculate similarity
            similarity = self.calculate_similarity(user_text, correct_answer)
            return similarity >= threshold
    
    def _word_to_number(self, word: str) -> Optional[int]:
        """Convert word representation to number"""
        word_numbers = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
            'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
            'eighteen': 18, 'nineteen': 19, 'twenty': 20
        }
        
        word_lower = word.lower().strip()
        
        try:
            # Try direct numeric conversion
            return int(word_lower)
        except ValueError:
            # Try word conversion
            return word_numbers.get(word_lower, None)
    
    def _adjust_confidence_by_context(self, intent: str, confidence: float,
                                     text: str, context: Dict) -> float:
        """
        Adjust confidence based on activity context
        
        Args:
            intent: Recognized intent
            confidence: Base confidence score
            text: User text
            context: Activity context
            
        Returns:
            Adjusted confidence score
        """
        # Boost confidence if intent matches expected type
        if context.get('expected_intent') == intent:
            confidence = min(1.0, confidence + 0.1)
        
        # Reduce confidence if very short input
        if len(text) < 3:
            confidence *= 0.8
        
        return confidence
    
    def _get_no_intent(self) -> Dict[str, any]:
        """Return no-intent recognition result"""
        return {
            'intent': 'unknown',
            'confidence': 0.0,
            'entities': {},
            'original_text': '',
            'intent_scores': {intent: 0.0 for intent in self.INTENT_PATTERNS.keys()}
        }
