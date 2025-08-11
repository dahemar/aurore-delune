import { useEffect, useRef, useState } from 'react'

export default function Lightbox() {
  const [state, setState] = useState({ open: false, src: '', caption: '' })
  const close = () => setState({ open: false, src: '', caption: '' })

  useEffect(() => {
    const handler = (e) => {
      const { src, caption } = e.detail || {}
      setState({ open: true, src, caption })
    }
    window.addEventListener('open-lightbox', handler)
    return () => window.removeEventListener('open-lightbox', handler)
  }, [])

  if (!state.open) return null
  return (
    <div id="overlay" onClick={close}>
      <div className="lightbox">
        <img id="lightbox-image" src={state.src} />
        <p id="lightbox-caption">{state.caption}</p>
      </div>
    </div>
  )
} 