import { Mastra } from '@mastra/core';
import { costAnalyzerAgent } from './agents/cost-analyzer.js';
import { env } from './config/env.js';
import { log } from './utils/logger.js';

/**
 * AWS Cost Management Agent - Main Configuration
 * This file is the central configuration file for the Mastra framework
 */

// Environment variables are now validated automatically by Zod
// If validation fails, detailed error messages will be thrown
log.success('Environment variables validated successfully with Zod');

/**
 * Main instance of Mastra framework
 */
const mastra = new Mastra({
  agents: {
    costAnalyzer: costAnalyzerAgent
  },
  // Disable telemetry for development environment (as per Mastra docs)
  telemetry: {
    enabled: false
  },
});

export { mastra };
export default mastra;

// Export agents and tools individually (if needed)
export { costAnalyzerAgent } from './agents/cost-analyzer.js';

/**
 * Basic operation test function
 * Used for simple testing from command line, etc.
 */
export async function testBasicCostAnalysis(): Promise<void> {
  try {
    log.process('AWS Cost Management Agent - Starting basic operation test');

    // Check environment variables using type-safe Zod validation
    log.success('Environment variable check (Zod validated):');
    log.info('OPENAI_API_KEY: ' + (env.OPENAI_API_KEY ? 'configured' : 'not set'));
    log.info('AWS_ACCESS_KEY_ID: ' + (env.AWS_ACCESS_KEY_ID ? 'configured' : 'not set'));
    log.info('AWS_SECRET_ACCESS_KEY: ' + (env.AWS_SECRET_ACCESS_KEY ? 'configured' : 'not set'));
    log.info('AWS_DEFAULT_REGION: ' + env.AWS_DEFAULT_REGION);

    // Check agent configuration
    log.info('Agent configuration check:', {
      agentName: costAnalyzerAgent.name,
      availableTools: costAnalyzerAgent.tools ? 'aws-cost-fetcher' : 'none'
    });

    log.success('Basic operation test completed!');
    log.info('You can use the agent with the following command: npm run dev');

  } catch (error) {
    log.error('Error occurred during operation test', { error: error instanceof Error ? error.message : error });
    throw error;
  }
} 