# AWS Cost Analyzer

A natural language AWS cost analysis template that allows users to call AWS Cost Explorer from a Mastra agent to check monthly costs and compare them with the previous month using natural language.
Designed for users who need to regularly monitor monthly AWS costs, such as project managers, FinOps personnel, and development leads.

> **Key Learning Points:** Demonstrates how to integrate external APIs (AWS SDK) with a Mastra agent, implement date parsing and conditional logic, and handle errors with proper logging.

## Overview

This template provides a practical AI agent for AWS cost management:

**Challenges:**
- Time-consuming cost checking: Logging into the AWS Console → Navigating Cost Explorer → Setting the time range → Reviewing data is cumbersome
- Requires expertise: Understanding the UI and concepts of Cost Explorer
- Analysis depends on individuals: Cost analysis relies on the technical skills of the person in charge
- Manual comparison takes time: Comparing current and previous month costs is a repetitive manual task

**Solution:**
- Fetch, analyze, and present cost data through natural language queries, offering intelligent insights.

### Key Features

- **Natural Language Queries:** e.g., “What was the cost for May 2025?” → Automatically parses the date and builds the query
- **Month-over-Month Comparison:** Displays increases or decreases in cost as a percentage
- **Service Breakdown:** Visualizes the cost distribution by AWS service
- **Production-Ready Design:** Built for stable operation with error handling and structured logging

## Prerequisites

- Node.js 18 or later
- OpenAI API key
- AWS credentials (access key) with access to AWS Cost Explorer

### How to Prepare AWS Credentials

Follow the steps below to create an IAM user with the necessary permissions for Cost Explorer and obtain access keys:
1. Create an IAM user
2. Create the custom policy below
3. Attach the policy to the IAM user
4. Generate the access key and secret key

### Custom Policy (for Cost Explorer Read Access)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CostExplorerReadOnly",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostCategories",
        "ce:GetDimensionValues",
        "ce:GetCostAndUsageWithResources",
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetTags",
        "ce:GetUsageForecast",
        "ce:DescribeReport"
      ],
      "Resource": "*"
    }
  ]
}
```

**Reference:** [AWS Cost Management Permissions](https://docs.aws.amazon.com/cost-management/latest/userguide/migrate-granularaccess-whatis.html) set precise permissions required for AWS Cost Explorer.

## Setup

1. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd aws-cost-analyzer
   npm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   # Set your API keys and other values
   ```

3. **Run the Agent:**
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable Name | Purpose |
|--------|------|
| `OPENAI_API_KEY` | OpenAI API key for LLM |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_DEFAULT_REGION` | AWS region (e.g., us-east-1) |
| `LOG_LEVEL` | Log level (debug/info/error) |

## Usage Examples

### Demo Video



https://github.com/user-attachments/assets/6290e9f6-85e7-461b-9ce1-4545d6c1bf08



### Basic Cost Inquiry

- **User:** "What’s the AWS cost this month?"
- **Agent:** "The total AWS cost for August 2025 is effectively $0.00 USD.〜〜"

### Date-Specific Analysis

- **User:** "What was the cost for May 2025?"
- **Agent:** "The AWS cost for May 2025 was $7.69 USD. Here's a detailed breakdown and analysis:〜〜"

## Architecture

### Project Structure

```
aws-cost-analyzer/
├── src/mastra/                    # All Mastra-related code
│   ├── agents/                    # Agent definitions
│   │   └── cost-analyzer.ts       # Main cost analysis agent
│   ├── tools/                     # Custom tool definitions
│   │   └── aws-cost-fetcher.ts    # AWS Cost Explorer API integration tool
│   ├── types/                     # TypeScript type definitions
│   │   └── aws-cost-data.ts       # Response types for AWS Cost Explorer API
│   ├── config/                    # Configuration files
│   │   └── env.ts                 # Environment variable validation (Zod)
│   ├── utils/                     # Shared utility functions
│   │   ├── date-helpers.ts        # Date processing utilities
│   │   ├── cost-calculations.ts   # Cost calculation and comparison logic
│   │   ├── error-handlers.ts      # Centralized error handling
│   │   └── logger.ts              # Structured logging (Pino)
│   └── index.ts                   # Main entry point
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore settings
├── package.json                   # ESM module settings
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Comprehensive documentation

```

### Tech Stack

- **Framework:** [Mastra](https://mastra.ai) - TypeScript agent framework
- **LLM:** OpenAI GPT-4 - Natural language understanding
- **AWS Integration:**
  - [@aws-sdk/client-cost-explorer (npm)](https://www.npmjs.com/package/@aws-sdk/client-cost-explorer) - Official SDK package to access Cost Explorer API
  - [Cost Explorer API Reference (AWS Docs)](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cost-explorer/) - Detailed specs and usage
- **Validation:** [Zod](https://zod.dev) - Type-safe validation
- **Logging:** [Pino](https://getpino.io) - High-performance logger
- **Date Parsing:** [chrono-node](https://github.com/wanasit/chrono) - Natural language date parser

## Learning Highlights

### 1. External API Integration Pattern (AWS SDK)

**tools/aws-cost-fetcher.ts:**
- **Cost Explorer API integration:** Initialize CostExplorerClient and call GetCostAndUsageCommand

### 2. Natural Language Date Parsing

**tools/aws-cost-fetcher.ts:**
- **Using chrono-node:** Safely converts inputs like “May 2025” or “last month” into date ranges with fallbacks

### 3. Production-Grade Error Handling

**utils/error-handlers.ts:**
- **Detailed AWS error categorization:** Classifies errors into 7 categories with retry suggestions

### 4. Type-Safe Environment Variable Management (Zod)

**config/env.ts:**
- **Validation for required .env keys:** Enforces type-safe use of environment variables, eliminating unsafe process.env.X usage

### 5. Structured Logging with Pino

**utils/logger.ts:**
- **Advanced logging system:** JSON-based logs with emojis, log level switching, and console fallback support

### 6. Cost Calculation Algorithms

**utils/cost-calculations.ts:** 
- **Month-over-month calculation:** `calculatePercentageChange()` computes percentage deltas
- **Trend detection:** `determineTrend()` classifies as `increasing / stable / decreasing` based on a ±5% threshold
- **Summarization and suggestions:** `generateCostSummary()` and `generateCostOptimizationSuggestions()` provide actionable recommendations (e.g., usage reviews)

### 7. Architectural Pattern

```
src/mastra/
├── agents/          # Business logic
├── tools/           # External API integrations
├── utils/           # Shared utilities
├── config/          # Configuration management
└── types/           # Type definitions

```

## Troubleshooting

### AWS credentials Error

- Make sure your `.env` file contains valid AWS credentials
- Confirm `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correctly set

### Access Denied Error

- Ensure the IAM user has the required Cost Explorer permissions
  - [Refer to the AWS Cost Explorer section](https://docs.aws.amazon.com/cost-management/latest/userguide/migrate-granularaccess-whatis.html)

### AWS Cost Explorer Data Limitation

- Cost Explorer only provides data for the past 13 months
- Make sure the requested date range is within that window

## Current Features

- ✅ **Natural Language Cost Query:** Instantly answer "What’s the AWS cost this month?"
- ✅ **Month-Over-Month Comparison:** Automatically calculate cost changes
- ✅ **Service Breakdown:** Visualize cost by AWS service
- ✅ **Robust Error Handling:** 7-category AWS error classification
- ✅ **Structured Logging:** Compatible with both development and production
- ✅ **Type-Safe Design:** Environment variable validation with Zod
- ✅ **High-Quality Library Integration:** Uses industry-standard libraries like chrono-node and Pino

## Customization Guide

**Report Generation（CSV/JSON/PDF）:** To output cost reports in various formats, create a new tool like `report-generator.ts` with the appropriate functions. Update the agent prompt to support report generation. For PDF, add dependencies such as `pdfkit`.

**Slack Notification Feature:** To send alerts or scheduled cost reports to Slack, implement a tool like `slack-notification.ts` and add `@slack/web-api` as a dependency. Set `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` in your environment variables. Customize threshold values and notification frequency.

**Tag-Based Analysis:** To analyze cost based on AWS resource tags, create a new tool like `tag-based-analysis.ts` and modify the `groupBy` parameter in `aws-cost-fetcher.ts` to `TAGS`. This enables cost breakdowns by environment (dev/staging/prod), project, or department for finer-grained insights.

## Dependencies

Key dependencies:

- `@mastra/core`: Mastra framework for agent and tool orchestration
- `@ai-sdk/openai`: OpenAI integration for natural language processing
- `@aws-sdk/client-cost-explorer`: AWS Cost Explorer API client
- `chrono-node`: Natural language date parsing library
- `pino`: High-performance structured logging
- `pino-pretty`: Pretty formatting for Pino logs
- `zod`: Type-safe schema validation

## License

### Apache License 2.0

Apache License 2.0 is a permissive open-source license that grants users broad rights to use, modify, and distribute the software. It allows:

- Free use for any purpose, including commercial use
- Viewing, modifying, and redistributing source code
- Creating and distributing derivative works
- Unrestricted commercial use
- Patent protection from contributors

### Compliance Requirements

Apache License 2.0 has minimal requirements:

- **Attribution:** Retain copyright and license information (including the NOTICE file)
- **Notice of Changes:** Clearly indicate any modifications made to the software
- **Include the License:** Include a copy of the Apache License 2.0 when distributing the software

### Implementation in This Project

1. **LICENSE file:** Includes a copy of the Apache License 2.0 at the project root
2. **NOTICE file:** Contains copyright notices for used libraries
3. **README.md:** Clearly states license information (this section)
4. **package.json:** The license field is set to "Apache-2.0"
