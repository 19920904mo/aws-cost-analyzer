import { z } from 'zod';

/**
 * Environment Variables Schema with Zod Validation
 * Provides type-safe environment variable handling with detailed error messages
 */
const envSchema = z.object({
  // OpenAI Configuration
  OPENAI_API_KEY: z
    .string()
    .min(1, 'OpenAI API key is required')
    .startsWith('sk-', 'OpenAI API key must start with "sk-"'),

  // AWS Configuration
  AWS_ACCESS_KEY_ID: z
    .string()
    .min(1, 'AWS Access Key ID is required')
    .min(16, 'AWS Access Key ID seems too short')
    .max(128, 'AWS Access Key ID seems too long'),

  AWS_SECRET_ACCESS_KEY: z
    .string()
    .min(1, 'AWS Secret Access Key is required')
    .min(32, 'AWS Secret Access Key seems too short'),

  AWS_DEFAULT_REGION: z
    .string()
    .default('us-east-1')
    .refine(
      (region) => /^[a-z]{2}-[a-z]+-[0-9]$/.test(region),
      'AWS region must be in format like "us-east-1"'
    ),

  // Optional Configuration
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info')
    .optional(),
});

/**
 * Parsed and validated environment variables
 * This will throw a detailed ZodError if validation fails
 */
export const env = envSchema.parse(process.env);

/**
 * Environment variables type
 * Use this for type-safe access throughout the application
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables and return detailed result
 * @returns Validation result with detailed error information
 */
export function validateEnvironmentVariables(): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  try {
    envSchema.parse(process.env);
    return { 
      isValid: true, 
      errors: [], 
      suggestions: [] 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      const suggestions = [
        '1. Create .env file based on .env.example',
        '2. Obtain required API keys from respective services:',
        '   - OpenAI: https://platform.openai.com/api-keys',
        '   - AWS: https://console.aws.amazon.com/iam/home#/security_credentials',
        '3. Ensure .env file is not committed to Git',
        '4. Check environment variable formats match requirements'
      ];
      
      return { 
        isValid: false, 
        errors, 
        suggestions 
      };
    }
    
    return { 
      isValid: false, 
      errors: ['Unknown validation error'], 
      suggestions: ['Please check your environment variables'] 
    };
  }
} 