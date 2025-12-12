import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const API_KEY = process.env.API_KEY
const AGENT_ID = process.env.AGENT_ID
const ENV_ID = process.env.AGENT_ENV_ID
console.log('API_KEY:', API_KEY)
console.log('AGENT_ID:', AGENT_ID)
console.log('ENV_ID:', ENV_ID)

app.post('/api/sendMessage', async (req, res) => {
  const { message } = req.body

  try {
    const response = await fetch(
      `https://dl.watson-orchestrate.ibm.com/v2/agents/${AGENT_ID}/environments/${ENV_ID}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ input: { text: message } }),
      }
    )

    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(3001, () => console.log('Server running on port 3001'))
