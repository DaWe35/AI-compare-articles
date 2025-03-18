# AI Content Comparison Vote Tool

A tool that uses multiple AI models to compare two versions of articles and determine which one is better. The tool processes pairs of articles from two input directories and generates voting results both in the console and CSV format.

## Setup

1. Create two directories: `input1` and `input2`
2. Place corresponding article pairs in these directories with matching filenames
3. Create a `.env` file with your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

## Run

Run the script:
```bash
UID=$(id -u) GID=$(id -g) docker-compose up
```

The tool will:
- Process all matching article pairs from the input directories
- Use multiple AI models to compare each pair
- Display voting results in the console
- Save detailed results to CSV files in the `output` directory

## Output

- Console output shows a simplified voting table
- CSV files in the `output` directory contain full results including model votes and reasoning 

Example output:
``` bash
Processing blog.md...

Voting Results for blog.md:
============================================================
Model                                   Vote
------------------------------------------------------------
google/gemini-2.0-pro-exp-02-05:free    article2
deepseek/deepseek-r1:free               article2
deepseek/deepseek-chat:free             article2
meta-llama/llama-3.3-70b-instruct:free  article1
rekaai/reka-flash-3:free                article2
qwen/qwq-32b:free                       article2
------------------------------------------------------------
Final Tally: Article 1: 1 votes, Article 2: 5 votes
============================================================
Results saved to /app/output/blog_results.csv
```

## Why not use structured outputs?

OpenRouter supports [structured outputs](https://openrouter.ai/docs/features/structured-outputs), which in theory is a great way to format the answer to JSON. In reality, many models don't work well with structured outputs, even if OpenRouter claims they support.
After some experiementations, I concluded it's better to ask the AI to return JSON, instead of using structured outputs. To make this work, I removed `<thinking>` and ` ```json ` markdown elements with regex and it works quite well.

Just in case if you want to experiement, here are the current models that actually supoprt it:
```js
const AI_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'google/gemini-2.0-pro-exp-02-05:free',
  'openai/gpt-4o-mini',
  'mistralai/mistral-saba',
  'cohere/command-r-08-2024',
]
```