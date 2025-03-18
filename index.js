import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const AI_MODELS = [
  'google/gemini-2.0-pro-exp-02-05:free',
  'deepseek/deepseek-r1:free',
  'deepseek/deepseek-chat:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'rekaai/reka-flash-3:free',
  'qwen/qwq-32b:free'
  /* Paid models:
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.1-405b-instruct',
  'openai/gpt-4o-mini',
  'mistralai/mistral-saba', */
]


async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
    return null
  }
}

async function compareArticles(article1, article2, model) {
  const prompt = `Compare these two articles and vote on which one is better. Return your response in the following JSON format:
{
  "vote": "article1" or "article2",
  "reason": "brief explanation of your choice"
}

Article 1:
${article1}

Article 2:
${article2}`

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://airdropscan.io',
        'X-Title': 'AirdropScan'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content
    
    // Clean up the response
    content = content
      .replace(/```json\n?/g, '') // Remove markdown json code blocks
      .replace(/```\n?/g, '')     // Remove any remaining code blocks
      .replace(/^[^{]*({.*})[^}]*$/s, '$1') // Extract only the JSON object
      .trim()
    
    try {
      return JSON.parse(content)
    } catch (e) {
      console.error(`Error parsing JSON from ${model}:`, e)
      return null
    }
  } catch (error) {
    console.error(`Error comparing articles with ${model}:`, error.message)
    return null
  }
}

function printVotingTable(results, filename) {
  console.log(`\nVoting Results for ${filename}:`)
  console.log('='.repeat(60))
  console.log('Model'.padEnd(40) + 'Vote')
  console.log('-'.repeat(60))
  
  let article1Votes = 0
  let article2Votes = 0

  results.forEach(result => {
    if (result) {
      const vote = result.vote
      if (vote === 'article1') article1Votes++
      if (vote === 'article2') article2Votes++
      
      console.log(
        result.model.padEnd(40) +
        result.vote
      )
    }
  })

  console.log('-'.repeat(60))
  console.log(`Final Tally: Article 1: ${article1Votes} votes, Article 2: ${article2Votes} votes`)
  console.log('='.repeat(60))
}

async function saveResultsToCSV(results, filename) {
  const csvContent = [
    ['Model', 'Vote', 'Reason'],
    ...results.filter(result => result).map(result => [
      result.model,
      result.vote,
      result.reason
    ])
  ].map(row => row.join(',')).join('\n')

  const outputDir = path.join(process.cwd(), 'output')
  await fs.mkdir(outputDir, { recursive: true })
  
  const csvPath = path.join(outputDir, `${path.parse(filename).name}_results.csv`)
  await fs.writeFile(csvPath, csvContent)
  console.log(`Results saved to ${csvPath}`)
}

async function main() {
  const input1Dir = path.join(process.cwd(), 'input1')
  const input2Dir = path.join(process.cwd(), 'input2')

  try {
    const files = await fs.readdir(input1Dir)

    for (const file of files) {
      console.log(`\nProcessing ${file}...`)
      
      const file1Path = path.join(input1Dir, file)
      const file2Path = path.join(input2Dir, file)

      const article1 = await readFile(file1Path)
      const article2 = await readFile(file2Path)

      if (article1 && article2) {
        const results = await Promise.all(
          AI_MODELS.map(async model => {
            const result = await compareArticles(article1, article2, model)
            return result ? { ...result, model } : null
          })
        )
        
        printVotingTable(results, file)
        await saveResultsToCSV(results, file)
      }
    }
  } catch (error) {
    console.error('Error processing files:', error.message)
  }
}

main() 