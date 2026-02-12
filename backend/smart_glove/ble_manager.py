"""
BLE Manager - Handles Bluetooth Low Energy connection to ESP32 SmartHapticGlove
"""

import asyncio
import logging
from typing import Optional, Callable
from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError

logger = logging.getLogger(__name__)

# ESP32 SmartHapticGlove UUIDs (must match Arduino code)
SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab"
CHARACTERISTIC_UUID = "abcd1234-5678-90ab-cdef-1234567890ab"
DEVICE_NAME = "SmartHapticGlove"


class BLEManager:
    """
    Singleton BLE Manager for SmartHapticGlove connection.
    Handles scanning, connecting, disconnecting, and sending motor commands.
    """

    _instance: Optional['BLEManager'] = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._client: Optional[BleakClient] = None
        self._device_address: Optional[str] = None
        self._connected = False
        self._on_disconnect_callback: Optional[Callable] = None
        self._initialized = True
        logger.info("BLEManager initialized")

    @property
    def is_connected(self) -> bool:
        """Check if currently connected to glove."""
        return self._connected and self._client is not None and self._client.is_connected

    @property
    def device_address(self) -> Optional[str]:
        """Get the currently connected device address."""
        return self._device_address if self.is_connected else None

    def _handle_disconnect(self, client: BleakClient):
        """Internal disconnect handler."""
        logger.info(f"Disconnected from {self._device_address}")
        self._connected = False
        if self._on_disconnect_callback:
            self._on_disconnect_callback()

    async def scan_for_glove(self, timeout: float = 10.0) -> Optional[dict]:
        """
        Scan for SmartHapticGlove device.
        
        Args:
            timeout: Scan timeout in seconds
            
        Returns:
            Device info dict or None if not found
        """
        logger.info(f"Scanning for {DEVICE_NAME} (timeout: {timeout}s)...")

        try:
            devices = await BleakScanner.discover(timeout=timeout)

            for device in devices:
                device_name = device.name or ""
                if DEVICE_NAME.lower() in device_name.lower():
                    logger.info(f"Found {DEVICE_NAME}: {device.address}")
                    return {
                        "name": device.name,
                        "address": device.address,
                        "rssi": getattr(device, 'rssi', None)
                    }

            logger.warning(f"{DEVICE_NAME} not found in scan")
            return None

        except BleakError as e:
            logger.error(f"BLE scan error: {e}")
            raise

    async def connect(self, address: Optional[str] = None, timeout: float = 10.0) -> bool:
        """
        Connect to SmartHapticGlove.
        
        Args:
            address: Optional device address. If None, will scan for device.
            timeout: Connection timeout in seconds
            
        Returns:
            True if connected successfully
        """
        async with self._lock:
            # Disconnect existing connection
            if self.is_connected:
                await self.disconnect()

            # Find device if address not provided
            if not address:
                device_info = await self.scan_for_glove(timeout)
                if not device_info:
                    raise ConnectionError(f"{DEVICE_NAME} not found. Make sure the glove is powered on.")
                address = device_info["address"]

            logger.info(f"Connecting to {address}...")

            try:
                self._client = BleakClient(address, disconnected_callback=self._handle_disconnect)
                await self._client.connect(timeout=timeout)

                # Verify service is available
                services = self._client.services
                if not services.get_service(SERVICE_UUID):
                    await self._client.disconnect()
                    raise ConnectionError(f"Device does not have expected service UUID: {SERVICE_UUID}")

                self._device_address = address
                self._connected = True
                logger.info(f"✅ Connected to SmartHapticGlove at {address}")
                return True

            except BleakError as e:
                logger.error(f"Connection failed: {e}")
                self._connected = False
                self._client = None
                raise ConnectionError(f"Failed to connect: {e}")

    async def disconnect(self) -> bool:
        """
        Disconnect from SmartHapticGlove.
        
        Returns:
            True if disconnected successfully
        """
        async with self._lock:
            if self._client and self._client.is_connected:
                try:
                    await self._client.disconnect()
                    logger.info("Disconnected from SmartHapticGlove")
                except BleakError as e:
                    logger.warning(f"Disconnect error: {e}")

            self._connected = False
            self._client = None
            self._device_address = None
            return True

    async def send_motor_command(self, command: str) -> bool:
        """
        Send motor command to ESP32.
        
        Args:
            command: Motor command string
                "1" - Activate motor 1 (left)
                "2" - Activate motor 2 (right)
                "3" - Activate both motors
                
        Returns:
            True if command sent successfully
        """
        if not self.is_connected:
            raise ConnectionError("Not connected to SmartHapticGlove")

        if command not in ["1", "2", "3"]:
            raise ValueError(f"Invalid motor command: {command}. Use '1', '2', or '3'.")

        try:
            logger.debug(f"Sending motor command: {command}")
            await self._client.write_gatt_char(CHARACTERISTIC_UUID, command.encode('utf-8'))
            logger.info(f"Motor command '{command}' sent successfully")
            return True

        except BleakError as e:
            logger.error(f"Failed to send command: {e}")
            raise ConnectionError(f"Failed to send motor command: {e}")

    async def activate_motor1(self) -> bool:
        """Activate motor 1 (left finger)."""
        return await self.send_motor_command("1")

    async def activate_motor2(self) -> bool:
        """Activate motor 2 (right finger)."""
        return await self.send_motor_command("2")

    async def activate_both_motors(self) -> bool:
        """Activate both motors simultaneously."""
        return await self.send_motor_command("3")

    async def send_haptic_pattern(self, pattern: str, intensity: int = 100) -> bool:
        """
        Send a haptic feedback pattern.
        
        Args:
            pattern: Pattern type ('pulse', 'wave', 'tap', 'gentle', 'moderate', 
                     'urgent', 'single-tap', 'double-tap', 'long')
            intensity: Intensity level (0-100), unused by ESP32 but kept for API compatibility
            
        Returns:
            True if pattern sent successfully
        """
        # Map patterns to motor commands
        pattern_mapping = {
            # Navigation patterns
            'pulse': '3',       # Both motors for pulse effect
            'wave': '1',        # Single motor for wave
            'tap': '2',         # Single motor tap
            
            # Alert patterns
            'gentle': '1',      # Light - one motor
            'moderate': '2',    # Medium - one motor
            'urgent': '3',      # Strong - both motors
            
            # Confirmation patterns
            'single-tap': '1',  # One tap
            'double-tap': '3',  # Both motors = stronger tap
            'long': '3',        # Both motors for sustained
        }

        command = pattern_mapping.get(pattern, '1')
        return await self.send_motor_command(command)

    def get_status(self) -> dict:
        """Get current connection status."""
        return {
            "connected": self.is_connected,
            "device_address": self._device_address,
            "device_name": DEVICE_NAME if self.is_connected else None,
            "service_uuid": SERVICE_UUID if self.is_connected else None,
            "characteristic_uuid": CHARACTERISTIC_UUID if self.is_connected else None
        }


# Global instance for easy access
_ble_manager: Optional[BLEManager] = None


def get_ble_manager() -> BLEManager:
    """Get the global BLE manager instance."""
    global _ble_manager
    if _ble_manager is None:
        _ble_manager = BLEManager()
    return _ble_manager
