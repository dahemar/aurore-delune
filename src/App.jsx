import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import Flies from './components/Flies'
import Typewriter from './components/Typewriter'
import FloatingGallery from './components/FloatingGallery'
import Lightbox from './components/Lightbox'
import HoverTrail from './components/HoverTrail'
import { useSheetData } from './hooks/useSheetData'
import { processImageUrl, preloadSheetData } from './utils/sheetsApi'

const base = import.meta.env.BASE_URL

function AudioPlayer() {
  const audioRef = useRef(null)
  const [src, setSrc] = useState('')
  useEffect(() => {
    const savedSrc = localStorage.getItem('audioSrc') || ''
    const savedTime = parseFloat(localStorage.getItem('audioTime') || '0')
    const savedPlaying = localStorage.getItem('audioPlaying') === 'true'
    if (savedSrc) {
      setSrc(savedSrc)
      const audio = audioRef.current
      audio.src = savedSrc
      const onLoaded = () => {
        if (!isNaN(savedTime)) audio.currentTime = savedTime
        if (savedPlaying) audio.play().catch(() => {})
      }
      audio.addEventListener('loadedmetadata', onLoaded, { once: true })
    }
  }, [])
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => { localStorage.setItem('audioTime', String(audio.currentTime)) }
    const onPlay = () => { localStorage.setItem('audioSrc', audio.src); localStorage.setItem('audioPlaying', 'true') }
    const onPause = () => { localStorage.setItem('audioPlaying', 'false') }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [])
  return <audio id="audio-player" ref={audioRef} preload="metadata" controls style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, width: 250, height: 30 }} />
}

function LayoutShell({ children }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  
  useEffect(() => {
    if (isHome) document.body.classList.add('home')
    else document.body.classList.remove('home')
  }, [isHome])
  
  useEffect(() => { 
    window.scrollTo(0, 0) 
  }, [location.pathname])
  
  // Preload de datos para mejorar la experiencia del usuario
  useEffect(() => {
    // Preload de todas las hojas en segundo plano
    const sheets = ['page1_je_mappelle_aurore', 'page2_topographie_etrange', 'page3_reliques_reve', 'page4_memoires_mont_songe']
    sheets.forEach(sheet => {
      preloadSheetData(sheet).catch(() => {}) // Ignorar errores del preload
    })
  }, [])
  
  return (
    <div className="container cursive-glow">
      <HoverTrail />
      {children}
      <AudioPlayer />
      <Lightbox />
      <Flies enabled={isHome} activateOnClick={false} />
    </div>
  )
}

function Checklist() {
  const location = useLocation()
  const path = location.pathname
  const items = [
    { id: 'item1', to: '/page1', label: "Je m'appelle Aurore Delune" },
    { id: 'item2', to: '/page2', label: "Topographie de l'étrange" },
    { id: 'item3', to: '/page3', label: 'Reliques du rêve' },
    { id: 'item4', to: '/page4', label: 'Mémoires du Mont Songe' },
  ]
  return (
    <div className="checklist">
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <input type="checkbox" id={it.id} defaultChecked={path === it.to} />
            <label htmlFor={it.id}><Link to={it.to}>{it.label}</Link></label>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const sfxRef = useRef(null)
  const homeImgRef = useRef(null)
  const sfxFiles = useRef([`${base}audio/1.m4a`, `${base}audio/2.m4a`, `${base}audio/3.m4a`])
  const sfxIndex = useRef(0)
  function playNextSfx() {
    const audio = sfxRef.current
    if (!audio) return
    const files = sfxFiles.current
    const idx = sfxIndex.current % files.length
    audio.src = files[idx]
    sfxIndex.current += 1
    audio.loop = false
    try { audio.pause(); audio.currentTime = 0; audio.load(); audio.play().catch(() => {}) } catch {}
  }
  useEffect(() => {
    const sfx = sfxRef.current
    if (!sfx) return
    const onEnded = () => { if (sfxIndex.current % sfxFiles.current.length !== 0) playNextSfx() }
    sfx.addEventListener('ended', onEnded)
    return () => sfx.removeEventListener('ended', onEnded)
  }, [])
  const onLogoClick = (e) => {
    const img = homeImgRef.current
    if (img) { img.classList.add('glow'); setTimeout(() => img.classList.remove('glow'), 400) }
    if (!isHome) { navigate('/'); return }
    e.preventDefault(); playNextSfx()
  }
  return (
    <>
      <button className="home-logo" onClick={onLogoClick} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
        <img ref={homeImgRef} src={`${base}images/orchidd.jpg`} alt="Home" />
      </button>
      <div className="main-content">{children}</div>
      <audio ref={sfxRef} style={{ display: 'none' }} />
    </>
  )
}

function SongSelect() {
  const options = [
    { value: '', label: 'chansons' },
    { value: `${base}audio/song1.wav`, label: 'Stray' },
    { value: `${base}audio/song2.wav`, label: 'deep Forest' },
  ]
  const onChange = (e) => {
    const selected = e.target.value
    const audio = document.getElementById('audio-player')
    if (selected && audio) { try { audio.pause(); audio.src = selected; audio.load(); audio.play().catch(() => {}) } catch {} }
  }
  return (
    <div className="simple-dropdown">
      <select id="tech-select" onChange={onChange}>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  )
}

function Home() { return (<Layout><Checklist /><SongSelect /></Layout>) }
function Page1() {
  const { data } = useSheetData('page1_je_mappelle_aurore')
  const first = Array.isArray(data) && data.length > 0 ? data[0] : null
  
  // Only render if we have data
  if (!first) {
    return (
      <Layout>
        <Checklist />
        <SongSelect />
      </Layout>
    )
  }
  
  const title = first.title
  const subtitle = first.content
  const imageUrl = first.image_url ? processImageUrl(first.image_url) : null
  const formTitle = first.form_title
  const formDescription = first.form_description

  const onSubmit = (e) => {
    e.preventDefault()
    const name = e.currentTarget.elements.name.value.trim()
    const email = e.currentTarget.elements.email.value.trim()
    const message = e.currentTarget.elements.message.value.trim()
    const body = `${name}\n${email}\n\n${message}`
    const mailto = `mailto:dawn.ng@outlook.com?subject=${encodeURIComponent('Website')}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  return (
    <Layout>
      <div className="content-box page1">
        <h1>{title}</h1>
        {subtitle && (
          <div className="type-container">
            <Typewriter text={subtitle} />
          </div>
        )}

        {formTitle && <h2>{formTitle}</h2>}
        {formDescription && <p>{formDescription}</p>}

        <form id="contactForm" onSubmit={onSubmit}>
          <label htmlFor="name">Votre nom :</label><br />
          <input type="text" id="name" name="name" required /><br /><br />

          <label htmlFor="email">Votre email :</label><br />
          <input type="email" id="email" name="email" required /><br /><br />

          <label htmlFor="message">Votre message:</label><br />
          <textarea id="message" name="message" rows={5} required />
          <br /><br />

          <button type="submit">Envoyer</button>
        </form>
      </div>

      {imageUrl && (
        <img src={imageUrl} height="200" style={{ marginTop: 50 }} alt="" />
      )}

      <Checklist />
      <SongSelect />
    </Layout>
  )
}
function Page2() { 
  const { data } = useSheetData('page2_topographie_etrange')
  const first = Array.isArray(data) && data.length > 0 ? data[0] : null
  
  const title = 'Topographie de l\'étrange'
  const subtitle = 'Du sacré dans le profane, de la beauté dans la décrépitude'
  
  // Get all images from the sheet for the floating gallery (skip first row if it's used for title/subtitle)
  console.log('Raw data from Google Sheets:', data)
  console.log('Data length:', data?.length || 0)
  
  const galleryItems = Array.isArray(data) && data.length > 1 ? data.slice(1).map((row, index) => {
    const rowNumber = index + 2 // +2 because we skip first row and arrays are 0-indexed
    console.log(`--- Processing Row ${rowNumber} ---`)
    console.log('Row data:', row)
    console.log('Original image_url:', row.image_url)
    
    const processedUrl = row.image_url ? processImageUrl(row.image_url) : ''
    console.log('Processed URL:', processedUrl)
    
    const item = {
      src: processedUrl,
      caption: row.caption || '',
      size: row.size || 'normal'
    }
    
    console.log('Created item:', item)
    return item
  }).filter((item, index) => {
    const rowNumber = index + 2
    console.log(`--- Filtering Row ${rowNumber} ---`)
    console.log('Item to filter:', item)
    
    const hasValidSrc = item.src && item.src.trim() !== ''
    console.log('Item has valid src?', hasValidSrc, 'src:', item.src)
    
    if (!hasValidSrc) {
      console.warn(`Row ${rowNumber} filtered out due to invalid src:`, item)
    } else {
      console.log(`Row ${rowNumber} passed filter successfully`)
    }
    
    return hasValidSrc
  }) : []
  
  console.log('=== FINAL RESULTS ===')
  console.log('Total rows in data:', data?.length || 0)
  console.log('Rows after skipping first:', data?.slice(1)?.length || 0)
  console.log('Final filtered items:', galleryItems.length)
  console.log('Final galleryItems:', galleryItems)
  
  return (
    <Layout>
      <div className="content-box page2">
        <h1>{title}</h1>
        {subtitle && (
          <div className="type-container">
            <Typewriter text={subtitle} />
          </div>
        )}
      </div>
      {galleryItems.length > 0 && <FloatingGallery items={galleryItems} />}
      <Checklist />
      <SongSelect />
    </Layout>
  ) 
}
function Page3() {
  const { data } = useSheetData('page3_reliques_reve')
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null
  
  // Only render if we have data
  if (!row) {
    return (
      <Layout>
        <Checklist />
        <SongSelect />
      </Layout>
    )
  }
  
  const title = row.title
  const typewriterText = row.content
  const imageUrl = row.image_url ? processImageUrl(row.image_url) : null
  
  return (
    <Layout>
      <div className="content-box page3">
        <div className="main-content">
          <h1>{title}</h1>
          <div className="type-container">
            <Typewriter text={typewriterText} />
          </div>

          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="" 
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                margin: '20px auto',
                maxHeight: '400px',
                objectFit: 'contain'
              }}
            />
          )}
        </div>
        <div className="checklist">
          <Checklist />
        </div>
        <div className="simple-dropdown">
          <SongSelect />
        </div>
      </div>
    </Layout>
  )
}
function Page4() {
  const { data } = useSheetData('page4_memoires_mont_songe')
  const rows = Array.isArray(data) ? data : []
  
  // Only render if we have data
  if (!rows || rows.length === 0) {
    return (
      <Layout>
        <Checklist />
        <SongSelect />
      </Layout>
    )
  }
  
  const typedIntro = rows.find((r) => String(r.text_type).toLowerCase() === 'introductory_quote')
  const typedMain = rows.find((r) => String(r.text_type).toLowerCase() === 'main_content')
  const introContent = typedIntro?.content
  const mainContent = typedMain?.content
  
  return (
    <Layout>
      <div className="content-box page4">
        <h1>Mémoires du Mont Songe</h1>
        {introContent && (
          <blockquote>
            <p>
              {introContent.split(/\n/).map((line, idx) => (
                <span key={idx}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </blockquote>
        )}
      </div>
      {mainContent && (
        <div className="poem page4-poem">
          <blockquote>
            {mainContent.split(/\n\n+/).map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </blockquote>
        </div>
      )}
      <Checklist />
      <SongSelect />
    </Layout>
  )
}

export default function App() {
  return (
    <LayoutShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/page1" element={<Page1 />} />
        <Route path="/page2" element={<Page2 />} />
        <Route path="/page3" element={<Page3 />} />
        <Route path="/page4" element={<Page4 />} />
      </Routes>
    </LayoutShell>
  )
}
