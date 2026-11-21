// orders service: owns orders, and asks the users service for each customer's name.
// In Kubernetes, USERS_URL is the users Service's DNS name (http://users:8080).
import express from 'express'

export const ORDERS = [
  { id: 101, userId: 1, item: 'Laptop stand', total: 45 },
  { id: 102, userId: 2, item: 'USB-C hub', total: 30 },
  { id: 103, userId: 1, item: 'Desk lamp', total: 25 },
]

export function createApp(usersUrl = process.env.USERS_URL || 'http://localhost:8081') {
  const app = express()
  app.disable('x-powered-by')

  async function customerName(userId) {
    const res = await fetch(`${usersUrl}/users/${userId}`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) throw new Error(`users service returned ${res.status}`)
    return (await res.json()).name
  }

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'orders' }))

  // Each order comes back with the customer's name, fetched from the users service
  app.get('/orders', async (req, res) => {
    try {
      const orders = await Promise.all(ORDERS.map(async (o) => ({ ...o, customer: await customerName(o.userId) })))
      res.json(orders)
    } catch (err) {
      res.status(502).json({ error: 'users service unavailable', detail: err.message })
    }
  })

  app.get('/orders/:id', async (req, res) => {
    const order = ORDERS.find((o) => o.id === Number(req.params.id))
    if (!order) return res.status(404).json({ error: 'order not found' })
    try {
      res.json({ ...order, customer: await customerName(order.userId) })
    } catch (err) {
      res.status(502).json({ error: 'users service unavailable', detail: err.message })
    }
  })

  return app
}
