#!/usr/bin/env node
/**
 * Local dev server for Netlify Functions — no Netlify CLI needed.
 * Serves functions at http://localhost:8888/.netlify/functions/<name>
 * 
 * Usage: node functions-server.js
 * Requires: .env in repo root with SUPABASE_URL, SUPABASE_ANON
 */

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')

// Load .env
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .forEach(l => {
      const [k, ...v] = l.split('=')
      if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/\r$/, '')
    })
}

const PORT = 8888
const FUNCTIONS_DIR = path.join(__dirname, 'netlify/functions')

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true)

  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // Match both /.netlify/functions/<name> and /api/<name>
  const match = parsed.pathname.match(/^\/.netlify\/functions\/([^/]+)/) ||
                parsed.pathname.match(/^\/api\/([^/]+)/)

  if (!match) {
    res.writeHead(404); res.end('Not found'); return
  }

  const fnName = match[1]
  const fnPath = path.join(FUNCTIONS_DIR, `${fnName}.js`)

  if (!fs.existsSync(fnPath)) {
    res.writeHead(404); res.end(`Function ${fnName} not found`); return
  }

  // Build event object like Netlify does
  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', async () => {
    const event = {
      httpMethod: req.method,
      path: parsed.pathname,
      queryStringParameters: parsed.query,
      headers: req.headers,
      body: body || null,
      isBase64Encoded: false,
    }

    try {
      // Clear module cache so edits hot-reload
      delete require.cache[require.resolve(fnPath)]
      const fn = require(fnPath)
      const result = await fn.handler(event, {})
      const statusCode = result.statusCode || 200
      const headers = result.headers || {}
      headers['Access-Control-Allow-Origin'] = '*'
      res.writeHead(statusCode, headers)
      res.end(result.body || '')
    } catch (err) {
      console.error(`[${fnName}] Error:`, err.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
  })
})

server.listen(PORT, () => {
  console.log(`✓ Functions server running at http://localhost:${PORT}`)
  console.log(`  Serving: ${FUNCTIONS_DIR}`)
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ set' : '✗ missing'}`)
  console.log(`  SUPABASE_ANON: ${process.env.SUPABASE_ANON ? '✓ set' : '✗ missing'}`)
  console.log()
  console.log('  Endpoints:')
  fs.readdirSync(FUNCTIONS_DIR)
    .filter(f => f.endsWith('.js'))
    .forEach(f => console.log(`    http://localhost:${PORT}/.netlify/functions/${f.replace('.js', '')}`))
})
