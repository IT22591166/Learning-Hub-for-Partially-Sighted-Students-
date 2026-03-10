/**
 * Main Application Entry Point
 * Voice-Interactive Learning Module
 */

import { VoiceLearningModule } from './core/voice-learning-module.js';
import { logger } from './utils/logger.js';

/**
 * Initialize and start the learning module
 */
async function main() {
  try {
    logger.info('Initializing Voice-Interactive Learning Module...');

    const module = new VoiceLearningModule({
      userId: process.env.USER_ID || 'demo-user',
      language: process.env.LANGUAGE || 'en-US',
      activities: ['counting-adventure', 'number-recognition'],
      adaptiveMode: true,
      emotionDetection: true,
      debug: process.env.DEBUG === 'true'
    });

    // Start the module
    await module.initialize();
    logger.info('Voice Learning Module initialized successfully');

    // Example: Start a learning session
    const session = await module.startSession({
      activityId: 'counting-adventure',
      duration: 10 * 60 * 1000 // 10 minutes
    });

    logger.info(`Session ${session.sessionId} started`);

  } catch (error) {
    logger.error('Failed to start module:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  process.exit(0);
});

// Start the application
main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});

export { VoiceLearningModule };
