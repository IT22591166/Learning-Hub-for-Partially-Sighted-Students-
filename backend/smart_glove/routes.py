"""
Smart Glove API Routes - Flask endpoints for ESP32 BLE haptic control
"""

import asyncio
import logging
from flask import Blueprint, jsonify, request
from .ble_manager import get_ble_manager

logger = logging.getLogger(__name__)

# Create Blueprint
smart_glove_bp = Blueprint('smart_glove', __name__, url_prefix='/api/smart-glove')


def run_async(coro):
    """Helper to run async code from sync Flask routes."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@smart_glove_bp.route('/status', methods=['GET'])
def get_status():
    """
    Get current BLE connection status.
    
    Returns:
        {
            "connected": boolean,
            "device_address": string or null,
            "device_name": string or null
        }
    """
    ble = get_ble_manager()
    return jsonify(ble.get_status())


@smart_glove_bp.route('/scan', methods=['GET'])
def scan_devices():
    """
    Scan for SmartHapticGlove device.
    
    Query params:
        timeout: Scan timeout in seconds (default: 10)
    
    Returns:
        {
            "found": boolean,
            "device": { "name": string, "address": string, "rssi": number } or null
        }
    """
    timeout = float(request.args.get('timeout', 10))

    try:
        ble = get_ble_manager()
        device = run_async(ble.scan_for_glove(timeout))
        return jsonify({
            "found": device is not None,
            "device": device
        })
    except Exception as e:
        logger.error(f"Scan error: {e}")
        return jsonify({"error": str(e)}), 500


@smart_glove_bp.route('/connect', methods=['POST'])
def connect():
    """
    Connect to SmartHapticGlove.
    
    Request body (optional):
        {
            "address": string,  // BLE device address, if known
            "timeout": number   // Connection timeout in seconds
        }
    
    Returns:
        {
            "success": boolean,
            "connected": boolean,
            "device_address": string or null,
            "message": string
        }
    """
    data = request.get_json() or {}
    address = data.get('address')
    timeout = float(data.get('timeout', 15))

    try:
        ble = get_ble_manager()
        run_async(ble.connect(address, timeout))
        status = ble.get_status()
        return jsonify({
            "success": True,
            "connected": True,
            "device_address": status["device_address"],
            "device_name": status["device_name"],
            "service_uuid": status["service_uuid"],
            "characteristic_uuid": status["characteristic_uuid"],
            "message": "Successfully connected to SmartHapticGlove"
        })
    except ConnectionError as e:
        return jsonify({
            "success": False,
            "connected": False,
            "device_address": None,
            "message": str(e)
        }), 400
    except Exception as e:
        logger.error(f"Connection error: {e}")
        return jsonify({
            "success": False,
            "connected": False,
            "device_address": None,
            "message": f"Connection failed: {e}"
        }), 500


@smart_glove_bp.route('/disconnect', methods=['POST'])
def disconnect():
    """
    Disconnect from SmartHapticGlove.
    
    Returns:
        {
            "success": boolean,
            "connected": boolean,
            "message": string
        }
    """
    try:
        ble = get_ble_manager()
        run_async(ble.disconnect())
        return jsonify({
            "success": True,
            "connected": False,
            "message": "Disconnected from SmartHapticGlove"
        })
    except Exception as e:
        logger.error(f"Disconnect error: {e}")
        return jsonify({
            "success": False,
            "connected": ble.is_connected,
            "message": f"Disconnect failed: {e}"
        }), 500


@smart_glove_bp.route('/motor', methods=['POST'])
def control_motor():
    """
    Send motor command to ESP32.
    
    Request body:
        {
            "command": "1" | "2" | "3"
        }
        
        Commands:
        - "1": Activate motor 1 (left)
        - "2": Activate motor 2 (right)  
        - "3": Activate both motors
    
    Returns:
        {
            "success": boolean,
            "command": string,
            "message": string
        }
    """
    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({
            "success": False,
            "message": "Missing 'command' in request body"
        }), 400

    command = str(data['command'])

    try:
        ble = get_ble_manager()
        run_async(ble.send_motor_command(command))
        return jsonify({
            "success": True,
            "command": command,
            "message": f"Motor command '{command}' sent successfully"
        })
    except ConnectionError as e:
        return jsonify({
            "success": False,
            "command": command,
            "message": str(e)
        }), 400
    except ValueError as e:
        return jsonify({
            "success": False,
            "command": command,
            "message": str(e)
        }), 400
    except Exception as e:
        logger.error(f"Motor command error: {e}")
        return jsonify({
            "success": False,
            "command": command,
            "message": f"Failed to send command: {e}"
        }), 500


@smart_glove_bp.route('/motor/1', methods=['POST'])
def activate_motor1():
    """Activate motor 1 (left finger)."""
    try:
        ble = get_ble_manager()
        run_async(ble.activate_motor1())
        return jsonify({"success": True, "motor": 1, "message": "Motor 1 activated"})
    except Exception as e:
        return jsonify({"success": False, "motor": 1, "message": str(e)}), 400


@smart_glove_bp.route('/motor/2', methods=['POST'])
def activate_motor2():
    """Activate motor 2 (right finger)."""
    try:
        ble = get_ble_manager()
        run_async(ble.activate_motor2())
        return jsonify({"success": True, "motor": 2, "message": "Motor 2 activated"})
    except Exception as e:
        return jsonify({"success": False, "motor": 2, "message": str(e)}), 400


@smart_glove_bp.route('/motor/both', methods=['POST'])
def activate_both():
    """Activate both motors simultaneously."""
    try:
        ble = get_ble_manager()
        run_async(ble.activate_both_motors())
        return jsonify({"success": True, "motor": "both", "message": "Both motors activated"})
    except Exception as e:
        return jsonify({"success": False, "motor": "both", "message": str(e)}), 400


@smart_glove_bp.route('/haptic-pattern', methods=['POST'])
def send_haptic_pattern():
    """
    Send haptic feedback pattern.
    
    Request body:
        {
            "pattern": string,
            "intensity": number (0-100, optional)
        }
        
        Patterns:
        - Navigation: "pulse", "wave", "tap"
        - Alert: "gentle", "moderate", "urgent"
        - Confirmation: "single-tap", "double-tap", "long"
    
    Returns:
        {
            "success": boolean,
            "pattern": string,
            "message": string
        }
    """
    data = request.get_json()
    if not data or 'pattern' not in data:
        return jsonify({
            "success": False,
            "message": "Missing 'pattern' in request body"
        }), 400

    pattern = data['pattern']
    intensity = int(data.get('intensity', 100))

    try:
        ble = get_ble_manager()
        run_async(ble.send_haptic_pattern(pattern, intensity))
        return jsonify({
            "success": True,
            "pattern": pattern,
            "intensity": intensity,
            "message": f"Haptic pattern '{pattern}' sent successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "pattern": pattern,
            "message": str(e)
        }), 400


@smart_glove_bp.route('/test', methods=['POST'])
def test_connection():
    """
    Test the connection by sending a quick haptic pulse.
    Useful for verifying the connection is working.
    
    Returns:
        {
            "success": boolean,
            "connected": boolean,
            "message": string
        }
    """
    try:
        ble = get_ble_manager()
        if not ble.is_connected:
            return jsonify({
                "success": False,
                "connected": False,
                "message": "Not connected to SmartHapticGlove"
            }), 400

        # Send a test pulse (both motors)
        run_async(ble.activate_both_motors())
        return jsonify({
            "success": True,
            "connected": True,
            "message": "Test haptic feedback sent successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "connected": ble.is_connected if ble else False,
            "message": f"Test failed: {e}"
        }), 500


def register_smart_glove_routes(app):
    """Register Smart Glove routes with Flask app."""
    app.register_blueprint(smart_glove_bp)
    logger.info("✅ Smart Glove BLE routes registered")
