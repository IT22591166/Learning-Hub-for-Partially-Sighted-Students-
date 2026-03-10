const GLOVE_API = 'http://localhost:5001/api/smart-glove'

const THROTTLE_MS = 400
let lastFired = 0

/**
 * Send a single motor pulse to the Smart Glove as a haptic notification.
 * Fires and forgets — never blocks the caller or shows errors to the user.
 * Throttled so rapid successive calls (e.g. repeated hovers) are ignored.
 * @param {'1'|'2'|'3'} [command='3'] Motor command: 1=left, 2=right, 3=both
 */
export function hapticNotify(command = '3') {
    const now = Date.now()
    if (now - lastFired < THROTTLE_MS) return
    lastFired = now

    fetch(`${GLOVE_API}/motor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
    }).catch(() => {})
}
