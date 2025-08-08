/**
 * Error Handling Utilities
 * Unified processing for AWS API and other errors
 */

import { log } from './logger.js';

/**
 * AWS Error Types
 */
export enum AWSErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  THROTTLING = 'THROTTLING',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error Response Type
 */
export interface ErrorResponse {
  success: false;
  error: string;
  errorType: string;
  suggestions?: string[];
  retryable: boolean;
}

/**
 * Analyze AWS errors and generate appropriate error response
 * @param error - Caught error
 * @returns Structured error response
 */
export function handleAWSError(error: unknown): ErrorResponse {
  if (!error) {
    return createErrorResponse(AWSErrorType.UNKNOWN, 'Unknown error occurred');
  }

  const err = error instanceof Error ? error : new Error(String(error));
  const errorMessage = err.message || err.toString();

  // Authentication errors
  if (errorMessage.includes('The security token included in the request is invalid') ||
      errorMessage.includes('SignatureDoesNotMatch') ||
      errorMessage.includes('InvalidAccessKeyId')) {
    return createErrorResponse(
      AWSErrorType.AUTHENTICATION,
      'AWS credentials are invalid. Please check your access key and secret key.',
      [
        '1. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file',
        '2. Verify access key is valid in AWS Console',
        '3. Ensure IAM user is in active status'
      ],
      false
    );
  }

  // Authorization errors (insufficient permissions)
  if (errorMessage.includes('UnauthorizedOperation') ||
      errorMessage.includes('AccessDenied') ||
      errorMessage.includes('Forbidden')) {
    return createErrorResponse(
      AWSErrorType.AUTHORIZATION,
      'Insufficient access permissions to AWS Cost Explorer.',
      [
        '1. Grant Cost Explorer permissions to IAM user',
        '2. Required permissions: ce:GetCostAndUsage, ce:GetDimensionValues',
        '3. Ask administrator to review IAM policies'
      ],
      false
    );
  }

  // Throttling and rate limiting
  if (errorMessage.includes('Throttling') ||
      errorMessage.includes('RequestLimitExceeded') ||
      errorMessage.includes('TooManyRequests')) {
    return createErrorResponse(
      AWSErrorType.THROTTLING,
      'AWS API rate limit reached. Please wait a moment and try again.',
      [
        '1. Wait 5-10 minutes before retrying',
        '2. Avoid consecutive rapid executions',
        '3. Contact AWS support for limit increase if needed'
      ],
      true
    );
  }

  // Parameter errors
  if (errorMessage.includes('ValidationException') ||
      errorMessage.includes('InvalidParameter') ||
      errorMessage.includes('invalid date')) {
    return createErrorResponse(
      AWSErrorType.INVALID_PARAMETER,
      'Request parameters are invalid. Please check date range and specification.',
      [
        '1. Ensure date format is YYYY-MM-DD',
        '2. Verify start date is before end date',
        '3. Specify period within the last 13 months'
      ],
      false
    );
  }

  // Data access limitations
  if (errorMessage.includes("You haven't enabled historical data") ||
      errorMessage.includes('historical data beyond')) {
    return createErrorResponse(
      AWSErrorType.INVALID_PARAMETER,
      'Cost Explorer historical data is not enabled or data for the specified period does not exist.',
      [
        '1. Enable data in AWS Billing and Cost Management (takes 24 hours)',
        '2. Try retrieving data for a shorter period',
        '3. Manually check data existence in Cost Explorer'
      ],
      false
    );
  }

  // Service unavailable
  if (errorMessage.includes('ServiceUnavailable') ||
      errorMessage.includes('InternalError') ||
      errorMessage.includes('500')) {
    return createErrorResponse(
      AWSErrorType.SERVICE_UNAVAILABLE,
      'AWS Cost Explorer service is temporarily unavailable.',
      [
        '1. Retry after waiting a moment',
        '2. Check AWS Service Health Dashboard',
        '3. Contact AWS support if the problem persists'
      ],
      true
    );
  }

  // Quota exceeded
  if (errorMessage.includes('LimitExceeded') ||
      errorMessage.includes('exceeded your current quota')) {
    return createErrorResponse(
      AWSErrorType.QUOTA_EXCEEDED,
      'AWS account usage limit exceeded.',
      [
        '1. Check Usage Limits in billing settings',
        '2. Increase limits as needed',
        '3. Contact AWS support for limit increase'
      ],
      false
    );
  }

  // Other unknown errors
  return createErrorResponse(
    AWSErrorType.UNKNOWN,
    `Unexpected error occurred: ${errorMessage}`,
    [
      '1. Retry after waiting a moment',
      '2. Check environment variable settings',
      '3. Contact administrator if the problem persists'
    ],
    true
  );
}





/**
 * Create error response
 */
function createErrorResponse(
  errorType: AWSErrorType | string,
  message: string,
  suggestions: string[] = [],
  retryable: boolean = false
): ErrorResponse {
  return {
    success: false,
    error: message,
    errorType: errorType.toString(),
    suggestions,
    retryable
  };
}

/**
 * Output error log in structured format using Pino
 * @param context - Context where error occurred
 * @param error - Error object
 * @param additionalInfo - Additional information
 */
export function logStructuredError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: err.message || err.toString(),
      name: err.name || 'UnknownError',
      stack: err.stack
    },
    additionalInfo
  };

  // Use imported logger directly
  log.error('Structured Error Log', errorInfo, '🚨');
} 