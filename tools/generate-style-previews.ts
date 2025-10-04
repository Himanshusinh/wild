/*
  Script: Generate style preview images using Flux Max (1:1) and save to /public/styles
  Usage:  npx ts-node wild/tools/generate-style-previews.ts
  Env:    BFL_API_KEY must be set (reuses the provider key)
*/

import fs from 'node:fs'
import path from 'node:path'
import axios from 'axios'
import { STYLE_CATALOG } from '../src/styles/stylesCatalog'

const API_KEY = process.env.BFL_API_KEY || process.env.BFLAI_API_KEY || ''
const MODEL = 'flux-kontext-max' // Flux Max
const ASPECT_RATIO = '1:1'
const OUTPUT_DIR = path.resolve(__dirname, '../public/styles')
const TIMEOUT_MS = 1000
const MAX_LOOPS = 180

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true })
}

async function pollForResult(pollingUrl: string): Promise<string> {
  for (let i = 0; i < MAX_LOOPS; i++) {
    await new Promise((res) => setTimeout(res, TIMEOUT_MS))
    const poll = await axios.get(pollingUrl, {
      headers: { accept: 'application/json', 'x-key': API_KEY },
      validateStatus: () => true
    })
    if (poll.status < 200 || poll.status >= 300) {
      const msg = (poll.data && (poll.data.message || poll.data.error)) || `HTTP ${poll.status}`
      throw new Error(`Polling failed: ${msg}`)
    }
    if (poll.data?.status === 'Ready') return String(poll.data?.result?.sample)
    if (poll.data?.status === 'Error' || poll.data?.status === 'Failed') throw new Error('Generation failed')
  }
  throw new Error('Timeout while polling generation result')
}

async function generateImage(prompt: string): Promise<string> {
  const endpoint = `https://api.bfl.ai/v1/${MODEL}`
  const body = { prompt, aspect_ratio: ASPECT_RATIO, output_format: 'jpeg' }
  const resp = await axios.post(endpoint, body, {
    headers: { accept: 'application/json', 'x-key': API_KEY, 'Content-Type': 'application/json' },
    validateStatus: () => true
  })
  if (resp.status < 200 || resp.status >= 300) {
    const msg = (resp.data && (resp.data.message || resp.data.error)) || `HTTP ${resp.status}`
    throw new Error(`Start generation failed: ${msg}`)
  }
  const pollingUrl = resp.data?.polling_url
  if (!pollingUrl) throw new Error('No polling_url in response')
  return await pollForResult(pollingUrl)
}

async function downloadToFile(url: string, filePath: string) {
  const res = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer', validateStatus: () => true })
  if (res.status < 200 || res.status >= 300) throw new Error(`Download failed: HTTP ${res.status}`)
  await fs.promises.writeFile(filePath, Buffer.from(res.data))
}

async function main() {
  if (!API_KEY) throw new Error('Missing BFL_API_KEY in env')
  await ensureDir(OUTPUT_DIR)

  // Generate for all styles; skip those already present
  const styles = STYLE_CATALOG
  let success = 0
  let skipped = 0

  for (const style of styles) {
    const fileName = path.basename(style.image) || `${style.value}.jpg`
    const outPath = path.join(OUTPUT_DIR, fileName)
    if (fs.existsSync(outPath)) {
      console.log(`↺ Skip ${style.name} (exists)`)
      skipped++
      continue
    }
    try {
      console.log(`▶ Generating ${style.name}…`)
      const url = await generateImage(style.prompt)
      await downloadToFile(url, outPath)
      console.log(`✔ Saved ${style.name} → ${outPath}`)
      success++
    } catch (e: any) {
      console.error(`✖ Failed ${style.name}:`, e?.message || e)
    }
  }

  console.log(`Done. Generated ${success}, skipped ${skipped}. Output: ${OUTPUT_DIR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


