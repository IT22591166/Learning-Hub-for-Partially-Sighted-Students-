const GLOVE_API = 'http://localhost:5001/api/smart-glove'

/**
 * Send a single motor pulse to the Smart Glove as a haptic notification.
 * Fires and forgets — never blocks the caller or shows errors to the user.
 * @param {'1'|'2'|'3'} [command='3'] Motor command: 1=left, 2=right, 3=both
 */
export function hapticNotify(command = '3') {
    fetch(`${GLOVE_API}/motor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
    }).catch(() => {})
}
