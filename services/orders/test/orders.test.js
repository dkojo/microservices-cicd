import assert from 'node:assert/strict'
import http from 'node:http'
import { after, before, test } from 'node:test'
import { createApp } from '../app.js'

// A stand-in for the users service, so these tests run without it
const fakeUsers = http.createServer((req, res) => {
  const id = Number(req.url.split('/').pop())
  const names = { 1: 'Test User One', 2: 'Test User Two' }
  if (!names[id]) {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id, name: names[id] }))
})

let server
let base
const listen = async (s) => {
  s.listen(0)
  await new Promise((r) => s.once('listening', r))
  return `http://127.0.0.1:${s.address().port}`
}

before(async () => {
  const usersUrl = await listen(fakeUsers)
  server = http.createServer(createApp(usersUrl))
  base = await listen(server)
})
after(() => {
  server.close()
  fakeUsers.close()
})

test('health check', async () => {
  assert.equal((await (await fetch(`${base}/health`)).json()).service, 'orders')
})

test('orders include the customer name from the users service', async () => {
  const orders = await (await fetch(`${base}/orders`)).json()
  assert.equal(orders.length, 3)
  assert.equal(orders[0].customer, 'Test User One')
  assert.equal(orders[1].customer, 'Test User Two')
})

test('gets one order by id', async () => {
  const order = await (await fetch(`${base}/orders/102`)).json()
  assert.equal(order.item, 'USB-C hub')
  assert.equal(order.customer, 'Test User Two')
})

test('unknown order is a 404', async () => {
  assert.equal((await fetch(`${base}/orders/999`)).status, 404)
})

test('users service down gives a 502, not a crash', async () => {
  const broken = http.createServer(createApp('http://127.0.0.1:9'))
  const url = await listen(broken)
  assert.equal((await fetch(`${url}/orders`)).status, 502)
  broken.close()
})
