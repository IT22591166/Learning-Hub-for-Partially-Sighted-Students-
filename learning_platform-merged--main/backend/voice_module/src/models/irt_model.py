"""
Item Response Theory Model
Research-grade adaptive difficulty implementation using IRT
"""

import numpy as np
import logging
from typing import Dict, List, Tuple, Optional
from scipy.stats import norm
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ItemParameters:
    """IRT item parameters"""
    difficulty: float  # b parameter (difficulty)
    discrimination: float  # a parameter (discrimination/slope)
    guessing: float  # c parameter (guessing/pseudo-chance)
    item_id: str = ""
    name: str = ""


@dataclass
class StudentAbility:
    """Student ability estimate"""
    ability: float  # θ (theta) - student ability
    standard_error: float  # SE of ability estimate
    item_count: int  # Number of items attempted
    correct_count: int  # Number of correct responses
    response_time_mean: float  # Mean response time
    confidence: float  # Confidence in estimate


class IRTModel:
    """
    Three-Parameter Logistic (3PL) Item Response Theory Model
    Adaptive difficulty engine based on student ability
    """
    
    def __init__(self, initial_ability: float = 0.0):
        """
        Initialize IRT model
        
        Args:
            initial_ability: Initial student ability estimate (θ)
        """
        self.initial_ability = initial_ability
        self.student_abilities: Dict[str, StudentAbility] = {}
        self.item_bank: Dict[str, ItemParameters] = {}
        self.response_history: Dict[str, List[Dict]] = {}
        
        # Calibration parameters
        self.discrimination_mean = 1.0
        self.discrimination_std = 0.3
    
    def evaluate_response(self, student_id: str, item_id: str, 
                         is_correct: bool, item_params: ItemParameters,
                         response_time: Optional[float] = None) -> StudentAbility:
        """
        Evaluate student response and update ability estimate
        Uses Bayesian updating with maximum likelihood estimation
        
        Args:
            student_id: Student identifier
            item_id: Item identifier
            is_correct: Whether response is correct
            item_params: Item parameters (a, b, c)
            response_time: Optional response time in seconds
            
        Returns:
            Updated student ability
        """
        # Initialize student if not exists
        if student_id not in self.student_abilities:
            self.student_abilities[student_id] = StudentAbility(
                ability=self.initial_ability,
                standard_error=1.0,
                item_count=0,
                correct_count=0,
                response_time_mean=0.0,
                confidence=0.0
            )
        
        student = self.student_abilities[student_id]
        
        # Update response history
        if student_id not in self.response_history:
            self.response_history[student_id] = []
        
        self.response_history[student_id].append({
            'item_id': item_id,
            'is_correct': is_correct,
            'response_time': response_time,
            'ability_before': student.ability,
            'se_before': student.standard_error
        })
        
        # Update counts
        student.item_count += 1
        if is_correct:
            student.correct_count += 1
        
        # Update response time
        if response_time is not None:
            if student.item_count == 1:
                student.response_time_mean = response_time
            else:
                # Exponential moving average
                alpha = 0.3
                student.response_time_mean = (alpha * response_time + 
                                             (1 - alpha) * student.response_time_mean)
        
        # Update ability estimate using Bayesian method
        self._update_ability_bayesian(student, item_params, is_correct)
        
        # Update confidence
        student.confidence = 1.0 - student.standard_error
        
        return student
    
    def select_next_item(self, student_id: str, item_bank: List[ItemParameters],
                         strategy: str = 'mfi') -> Optional[ItemParameters]:
        """
        Select next item based on student ability and selection strategy
        
        Args:
            student_id: Student identifier
            item_bank: Available items
            strategy: Selection strategy ('mfi'=max fisher info, 'difficulty'=closest difficulty)
            
        Returns:
            Next item to administer
        """
        if student_id not in self.student_abilities:
            # Return easiest item for new student
            return min(item_bank, key=lambda x: x.difficulty)
        
        student = self.student_abilities[student_id]
        
        # Filter used items (optional: allow repeats)
        used_item_ids = {item['item_id'] for item in self.response_history.get(student_id, [])}
        available_items = [item for item in item_bank if item.item_id not in used_item_ids]
        
        if not available_items:
            # If all items used, allow repeats
            available_items = item_bank
        
        if strategy == 'mfi':
            # Maximum Fisher Information
            best_item = max(
                available_items,
                key=lambda item: self._fisher_information(student.ability, item)
            )
            return best_item
        
        elif strategy == 'difficulty':
            # Difficulty closest to student ability
            best_item = min(
                available_items,
                key=lambda item: abs(item.difficulty - student.ability)
            )
            return best_item
        
        else:
            # Random selection
            return available_items[np.random.randint(len(available_items))]
    
    def get_probability_correct(self, ability: float, 
                               item_params: ItemParameters) -> float:
        """
        Calculate probability of correct response using 3PL model
        P(θ) = c + (1 - c) / (1 + exp(-a(θ - b)))
        
        Args:
            ability: Student ability (θ)
            item_params: Item parameters
            
        Returns:
            Probability of correct response (0-1)
        """
        a = item_params.discrimination
        b = item_params.difficulty
        c = item_params.guessing
        
        exponent = -a * (ability - b)
        
        # Avoid numerical overflow
        if exponent > 100:
            prob = c
        elif exponent < -100:
            prob = 1.0
        else:
            prob = c + (1 - c) / (1 + np.exp(exponent))
        
        return float(np.clip(prob, 0, 1))
    
    def _update_ability_bayesian(self, student: StudentAbility, 
                                item_params: ItemParameters, 
                                is_correct: bool):
        """
        Update ability using Bayesian estimation
        Uses Fisher information to update standard error
        
        Args:
            student: Student ability object
            item_params: Item parameters
            is_correct: Whether response is correct
        """
        # Current ability and SE
        theta = student.ability
        se = student.standard_error
        
        # Probability of response
        prob_correct = self.get_probability_correct(theta, item_params)
        
        # Likelihood
        likelihood = prob_correct if is_correct else (1 - prob_correct)
        likelihood = max(likelihood, 1e-10)  # Avoid log(0)
        
        # Log likelihood
        log_lik = np.log(likelihood)
        
        # Fisher information
        info = self._fisher_information(theta, item_params)
        
        # Bayesian update
        # New SE based on Fisher information
        new_se = 1.0 / np.sqrt(1.0 / (se ** 2) + info)
        
        # Likelihood slope (derivative approximation)
        delta = 0.001
        lik_plus = self.get_probability_correct(theta + delta, item_params)
        lik_minus = self.get_probability_correct(theta - delta, item_params)
        
        if is_correct:
            slope = lik_plus - lik_minus
        else:
            slope = -(lik_plus - lik_minus)
        
        # Update ability estimate
        learning_rate = 0.15 * (1.0 - np.exp(-info))  # Adaptive learning rate
        ability_change = learning_rate * slope
        
        student.ability += ability_change
        student.standard_error = new_se
    
    def _fisher_information(self, ability: float, 
                           item_params: ItemParameters) -> float:
        """
        Calculate Fisher information at given ability
        I(θ) = a² * P'(θ)² / (P(θ) * Q(θ))
        
        Args:
            ability: Student ability
            item_params: Item parameters
            
        Returns:
            Fisher information value
        """
        P = self.get_probability_correct(ability, item_params)
        Q = 1 - P
        
        a = item_params.discrimination
        b = item_params.difficulty
        c = item_params.guessing
        
        # Derivative of response function
        exp_term = np.exp(-a * (ability - b))
        dP = a * (1 - c) * exp_term / ((1 + exp_term) ** 2)
        
        # Fisher information
        if P > 0 and Q > 0:
            info = (dP ** 2) / (P * Q)
        else:
            info = 0.0
        
        return float(info)
    
    def get_recommended_difficulty(self, student_id: str) -> float:
        """
        Get recommended difficulty for next item
        Based on student ability and performance
        
        Args:
            student_id: Student identifier
            
        Returns:
            Recommended difficulty level
        """
        if student_id not in self.student_abilities:
            return 0.0  # Start with medium difficulty
        
        student = self.student_abilities[student_id]
        
        # Recommended difficulty = student ability
        # (maximum information at this difficulty)
        return float(student.ability)
    
    def get_statistics(self, student_id: str) -> Dict:
        """
        Get summary statistics for student
        
        Args:
            student_id: Student identifier
            
        Returns:
            Dictionary of statistics
        """
        if student_id not in self.student_abilities:
            return {
                'ability': 0.0,
                'standard_error': 1.0,
                'items_attempted': 0,
                'accuracy': 0.0,
                'performance_trend': 'neutral'
            }
        
        student = self.student_abilities[student_id]
        
        # Calculate accuracy
        if student.item_count > 0:
            accuracy = student.correct_count / student.item_count
        else:
            accuracy = 0.0
        
        # Determine performance trend
        if student.item_count >= 5:
            recent_responses = self.response_history[student_id][-5:]
            recent_correct = sum(1 for r in recent_responses if r['is_correct'])
            recent_accuracy = recent_correct / 5
            
            if recent_accuracy > 0.75:
                trend = 'improving'
            elif recent_accuracy < 0.50:
                trend = 'struggling'
            else:
                trend = 'stable'
        else:
            trend = 'neutral'
        
        return {
            'student_id': student_id,
            'ability': float(student.ability),
            'standard_error': float(student.standard_error),
            'confidence': float(student.confidence),
            'items_attempted': student.item_count,
            'correct_responses': student.correct_count,
            'accuracy': float(accuracy),
            'performance_trend': trend,
            'response_time_mean': float(student.response_time_mean)
        }
    
    def calibrate_item(self, item_data: List[Dict]) -> ItemParameters:
        """
        Calibrate item parameters from response data
        Simple maximum likelihood estimation
        
        Args:
            item_data: List of response records with 'ability' and 'is_correct'
            
        Returns:
            Calibrated item parameters
        """
        if not item_data:
            return ItemParameters(
                difficulty=0.0,
                discrimination=1.0,
                guessing=0.2,
                item_id="uncalibrated"
            )
        
        # Extract abilities and responses
        abilities = np.array([d.get('ability', 0.0) for d in item_data])
        responses = np.array([d.get('is_correct', False) for d in item_data])
        
        # Estimate difficulty (ability at P = 0.5)
        difficulty = np.median(abilities)
        
        # Estimate discrimination
        sorted_indices = np.argsort(abilities)
        n = len(sorted_indices)
        
        # Split at median
        lower_group = responses[sorted_indices[:n//2]]
        upper_group = responses[sorted_indices[n//2:]]
        
        p_lower = np.mean(lower_group)
        p_upper = np.mean(upper_group)
        
        # Discrimination ≈ (p_upper - p_lower) / ability_range
        ability_range = abilities.max() - abilities.min()
        if ability_range > 0:
            discrimination = (p_upper - p_lower) / ability_range * 2
        else:
            discrimination = 1.0
        
        discrimination = np.clip(discrimination, 0.3, 3.0)
        
        # Estimate guessing (minimum probability)
        guessing = np.min(responses) if np.min(responses) > 0 else 0.1
        
        return ItemParameters(
            difficulty=float(difficulty),
            discrimination=float(discrimination),
            guessing=float(guessing)
        )
