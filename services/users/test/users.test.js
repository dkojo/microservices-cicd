import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { app } from '../app.js'

let server
let base

before(async () => {
  server = app.listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}`
})
after(() => server.close())

test('health check', async () => {
  const res = await fetch(`${base}/health`)
  assert.equal(res.status, 200)
  assert.equal((await res.json()).service, 'users')
})

test('lists users', async () => {
  const users = await (await fetch(`${base}/users`)).json()
  assert.equal(users.length, 3)
})

test('gets one user by id', async () => {
  const user = await (await fetch(`${base}/users/2`)).json()
  assert.equal(user.name, 'Kwame Boateng')
})

test('unknown user is a 404', async () => {
  assert.equal((await fetch(`${base}/users/99`)).status, 404)
})
