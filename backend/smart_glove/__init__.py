"""
Smart Glove Module - ESP32 BLE Haptic Motor Control
Connects to ESP32 SmartHapticGlove device and controls 2 haptic motors via BLE.
"""

from .ble_manager import BLEManager
from .routes import register_smart_glove_routes

__all__ = ['BLEManager', 'register_smart_glove_routes']
