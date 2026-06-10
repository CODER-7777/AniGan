import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import './App.css' // Import your new styles!
import ParallaxViewer from './components/ParallaxViewer'

export default function App() {
  const [file, setFile] = useState(null)
  const [originalImage, setOriginalImage] = useState(null)
  const [resultImage, setResultImage] = useState(null)
  const [depthImage, setDepthImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((acceptedFiles) => {
    const droppedFile = acceptedFiles[0]
    if (!droppedFile) return
    setFile(droppedFile)
    setOriginalImage(URL.createObjectURL(droppedFile))
    setResultImage(null)
    setDepthImage(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
  })

  const handleTransform = async () => {
    if (!file) return
    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file) // Send the actual file object!
      formData.append('style', 'hayao') 

      const result = await axios.post(
        'http://localhost:3001/api/transform',
        formData
      )
      setResultImage(result.data.output)
      setDepthImage(result.data.depth)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1 className="title">Anime Style Transfer</h1>

      <div className="card">
        <div {...getRootProps()} style={{
          border: '2px dashed var(--sakura)',
          padding: '40px',
          textAlign: 'center',
          borderRadius: '16px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}>
          <input {...getInputProps()} />
          <p>{isDragActive ? 'Drop it!' : 'Drag & drop a photo here'}</p>
        </div>

        <button 
          className="transform-btn" 
          onClick={handleTransform} 
          disabled={!file || loading}
        >
          {loading ? 'Processing...' : '✨ Transform to Anime'}
        </button>

        {resultImage && (
          <div style={{ marginTop: '20px', textAlign: 'center', width: '100%' }}>
            <h3 style={{ marginBottom: '10px' }}>Hover to see 3D effect!</h3>
            {depthImage ? (
              <ParallaxViewer imageSrc={resultImage} depthSrc={depthImage} />
            ) : (
              <img src={resultImage} alt="Anime" style={{ width: '100%', borderRadius: '16px' }} />
            )}
            <a
              href={resultImage}
              download="anime_result.jpg"
              style={{
                display: 'inline-block', marginTop: 20, padding: '10px 20px', 
                background: 'var(--sakura)', color: 'white', borderRadius: '8px', textDecoration: 'none'
              }}
            >
              ⬇ Download 2D Version
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
