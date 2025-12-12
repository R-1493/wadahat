export class ApiAgentService {
  async sendMessage(message) {
    const response = await fetch('http://localhost:3001/api/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message via server')
    }
    return response.json()
  }
}
