// server/index.js
const express = require('express')
const multer  = require('multer')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')
const axios   = require('axios')

const app    = express()
const upload = multer({ dest: 'uploads/' })

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/uploads', express.static('uploads'))

app.post('/api/transform', upload.single('image'), async (req, res) => {
  try {
    const imageFile  = req.file
    const style      = req.body.style || 'hayao'
    const prompt     = req.body.prompt || ''
    const inputPath  = path.resolve(imageFile.path)
    const outputFile = `${imageFile.filename}_result.jpg`
    const outputPath = path.resolve('uploads', outputFile)

    console.log(`Calling ML service: style=${style}, prompt="${prompt}"`)

    // ── Call Flask ML service ──────────────────────────────────────
    const mlResponse = await axios.post('http://localhost:5001/transform', {
      image_path:  inputPath,
      style:       style,
      prompt:      prompt,
      output_path: outputPath,
    }, { timeout: 120000 })  // 2 min timeout for diffusion models

    if (!mlResponse.data.success && !mlResponse.data.output_path) {
      throw new Error(mlResponse.data.error || 'ML service failed')
    }

    // Return the output URL for the frontend to display
    const outputUrl = `http://localhost:3001/uploads/${outputFile}`
    let depthUrl = null
    if (mlResponse.data.depth_path) {
      const depthFile = path.basename(mlResponse.data.depth_path)
      depthUrl = `http://localhost:3001/uploads/${depthFile}`
    }

    res.json({
      success: true,
      output:  outputUrl,
      depth:   depthUrl,
      style:   style,
    })

  } catch (err) {
    console.error('Pipeline error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001')
})