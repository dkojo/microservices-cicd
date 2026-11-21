// users service: owns the list of users. Other services ask it for user details over HTTP.
import express from 'express'

export const USERS = [
  { id: 1, name: 'Ama Mensah' },
  { id: 2, name: 'Kwame Boateng' },
  { id: 3, name: 'Efua Owusu' },
]

export const app = express()
app.disable('x-powered-by')

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'users' }))

app.get('/users', (req, res) => res.json(USERS))

app.get('/users/:id', (req, res) => {
  const user = USERS.find((u) => u.id === Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'user not found' })
  res.json(user)
})
