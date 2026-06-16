import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import './App.css'

const STYLES = [
  { id: 'hayao',   label: 'Hayao',   jp: '早雄',  desc: 'Soft · Dreamy · Ghibli' },
  { id: 'paprika', label: 'Paprika', jp: 'パプリカ', desc: 'Vivid · Surreal · Bold' },
  { id: 'shinkai', label: 'Shinkai', jp: '新海',  desc: 'Sharp · Cinematic · Blue' },
]

export default function App() {
  const [file,          setFile]          = useState(null)
  const [originalURL,   setOriginalURL]   = useState(null)
  const [resultURL,     setResultURL]     = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('hayao')
  const [prompt,        setPrompt]        = useState('')

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setOriginalURL(URL.createObjectURL(f))
    setResultURL(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const handleTransform = async () => {
    if (!file) return
    setLoading(true)
    setResultURL(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('style', selectedStyle)
      formData.append('prompt', prompt)
      const res = await axios.post(
        'http://localhost:3001/api/transform',
        formData,
        { timeout: 120000 }  // 2 min timeout for diffusion
      )
      setResultURL(res.data.output)
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.error || 'Transform failed — check console'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="header">
        <div className="header-logo">
          <span className="header-logo-icon">🎌</span>
          <span className="header-logo-text">AnimeStyle</span>
        </div>
        <div className="header-jp">アニメスタイル転送</div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="hero">
        <p className="hero-eyebrow">Multi-Modal Anime Generation</p>
        <h1 className="hero-title">Transform Reality<br />Into Anime</h1>
        <p className="hero-subtitle">
          Upload a photo and describe the mood you want.
          Our AI will generate an anime version that matches both.
        </p>
      </section>

      {/* ── Main Content ───────────────────────────────── */}
      <main className="main">
        <div className="card animate-delay-1">

          {/* Style Selector */}
          <div className="style-selector">
            <p className="style-selector-label">Choose Your Style</p>
            <div className="style-buttons">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  className={`style-btn ${selectedStyle === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(s.id)}
                >
                  {s.label} {s.jp}
                </button>
              ))}
            </div>
            <div className="style-meta">
              {STYLES.filter(s => s.id === selectedStyle).map(s => (
                <span key={s.id} className="style-tag">
                  <span>✦</span>{s.desc}
                </span>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
          >
            <input {...getInputProps()} />
            <span className="dropzone-icon">
              {originalURL ? '🖼️' : '📷'}
            </span>
            <p className="dropzone-title">
              {originalURL ? 'Image ready — drop another to change' : 'Drop your photo here'}
            </p>
            <p className="dropzone-subtitle">
              or <em>click to browse</em> — JPG, PNG, WEBP supported
            </p>
          </div>

          {/* ── Text Prompt Input (Multi-Modal) ────────── */}
          <div className="prompt-section">
            <p className="style-selector-label">Describe Your Vision</p>
            <input
              type="text"
              className="glass-input"
              placeholder='e.g. "Ghibli scene in the rain at sunset" or "cyberpunk neon city at night"'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <p className="prompt-hint">
              Optional — adds mood, weather, lighting to the anime conversion
            </p>
          </div>

          {/* Transform Button */}
          <button
            className="transform-btn"
            onClick={handleTransform}
            disabled={!file || loading}
          >
            <span className="transform-btn-inner">
              {loading ? (
                <>
                  <span className="spinner" />
                  Generating anime...
                </>
              ) : (
                <>✨ Transform to Anime</>
              )}
            </span>
          </button>

        </div>

        {/* ── Result Area ──────────────────────────────── */}
        {(originalURL || resultURL || loading) && (
          <div className="result-section card animate-delay-2"
               style={{ marginTop: 'var(--space-xl)' }}>

            <div style={{ display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 'var(--space-lg)' }}>
              <p className="style-selector-label">Result</p>
              {loading && (
                <span className="badge badge--purple">
                  <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                  AI is generating...
                </span>
              )}
              {resultURL && !loading && (
                <span className="badge badge--sakura">
                  <span className="status-dot" />
                  Complete
                </span>
              )}
            </div>

            <div className="result-grid">

              {/* Original */}
              <div className="image-panel image-panel--original">
                <span className="panel-label panel-label--original">Original</span>
                {originalURL && (
                  <img
                    src={originalURL}
                    alt="original"
                    className="result-image"
                  />
                )}
              </div>

              {/* Result */}
              <div className="image-panel image-panel--result">
                <span className="panel-label panel-label--result">
                  {STYLES.find(s => s.id === selectedStyle)?.label} Style
                </span>

                {loading && (
                  <div className="loading-overlay">
                    <div className="loading-dots">
                      <span /><span /><span />
                    </div>
                    <p className="loading-text">AI is re-rendering your photo as anime...</p>
                    <p className="loading-jp">変換中</p>
                    <p className="loading-text" style={{ fontSize: '0.7rem', marginTop: '8px' }}>
                      This may take 15-60 seconds
                    </p>
                  </div>
                )}

                {resultURL && !loading && (
                  <>
                    <img
                      src={resultURL}
                      alt="anime result"
                      className="result-image"
                    />

                    <a
                      href={resultURL}
                      download="anime_result.jpg"
                      className="download-btn"
                    >
                      ⬇ Save
                    </a>
                  </>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="footer">
        Built with <span>♥</span> at ARIITK · Powered by Stable Diffusion
      </footer>

    </div>
  )
}
