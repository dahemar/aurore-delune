import { useEffect, useRef, useCallback } from 'react'

function getFilenameCaption(src) {
  try {
    if (!src) return ''
    const u = new URL(src, window.location.href)
    const last = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '')
    if (!last) return ''
    const base = last.replace(/\.[a-zA-Z0-9]+$/, '')
    return base.replace(/[\-_]+/g, ' ').trim()
  } catch {
    return ''
  }
}

export default function Lightbox({ isOpen, imageSrc, imageCaption, imageDescription, onClose }) {
  const imageRef = useRef(null)
  const textRef = useRef(null)
  const contentRef = useRef(null)
  const resizeObsRef = useRef(null)

  const updateImageMaxHeight = useCallback(() => {
    const img = imageRef.current
    const text = textRef.current
    const content = contentRef.current
    if (!img || !content) return

    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Determine ratio first and decide stacking
    let naturalW = img.naturalWidth || 0
    let naturalH = img.naturalHeight || 0
    if (!naturalW || !naturalH) {
      naturalW = img.width || 0
      naturalH = img.height || 0
    }
    const ratio = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : 0
    const shouldForceStack = viewportWidth > 768 && ratio >= 1.8
    if (shouldForceStack) content.classList.add('force-stack')
    else content.classList.remove('force-stack')

    const hasText = Boolean((imageCaption && String(imageCaption).trim()) || (imageDescription && String(imageDescription).trim()) || getFilenameCaption(imageSrc))
    const isStacked = viewportWidth <= 768 || content.classList.contains('force-stack')
    console.log('[Lightbox] updateImageMaxHeight()', {
      viewportWidth,
      viewportHeight,
      isStacked,
      hasForceStack: content.classList.contains('force-stack'),
      ratio: ratio.toFixed(3),
    })

    // Compute vertical paddings/margins (container paddings + spacing)
    const verticalChrome = isStacked ? 32 : 60
    const gapPx = (() => {
      try { return parseInt(getComputedStyle(content).gap, 10) || 24 } catch { return 24 }
    })()
    const measuredTextHeight = (isStacked && text) ? text.offsetHeight : 0
    const minCaptionReserve = isStacked && hasText ? 160 : 0
    const reservedForText = isStacked ? Math.max(measuredTextHeight + gapPx, minCaptionReserve) : 0

    const available = Math.max(160, viewportHeight - verticalChrome - reservedForText)
    const desiredMax = isStacked ? Math.min(available, Math.round(viewportHeight * 0.62)) : available
    img.style.maxHeight = `${desiredMax}px`
    console.log('[Lightbox] computed sizes', { verticalChrome, gapPx, measuredTextHeight, reservedForText, available, desiredMax, isStacked })
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      console.log('[Lightbox] OPEN', { src: imageSrc, hasCaption: Boolean(imageCaption), hasDescription: Boolean(imageDescription) })
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      document.body.classList.add('lightbox-open')
      // Hide and pause global audio player
      try {
        const audio = document.getElementById('audio-player')
        if (audio) {
          audio.dataset.prevDisplay = audio.style.display || ''
          audio.style.display = 'none'
          try { audio.pause() } catch {}
        }
      } catch {}
      // Defer to next frame so DOM has measured sizes
      requestAnimationFrame(updateImageMaxHeight)
      // If image already cached/complete, compute immediately
      const img = imageRef.current
      if (img && img.complete) {
        console.log('[Lightbox] image already complete, computing immediately')
        updateImageMaxHeight()
      }
      // Fallback after a tick in case fonts/layout affect caption height
      setTimeout(updateImageMaxHeight, 50)
      window.addEventListener('resize', updateImageMaxHeight)
      // Observe caption/description height changes
      const textEl = textRef.current
      if ('ResizeObserver' in window && textEl) {
        const ro = new ResizeObserver(() => {
          console.log('[Lightbox] text ResizeObserver fired')
          updateImageMaxHeight()
        })
        ro.observe(textEl)
        resizeObsRef.current = ro
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      document.body.classList.remove('lightbox-open')
      // Restore audio player visibility
      try {
        const audio = document.getElementById('audio-player')
        if (audio) {
          audio.style.display = audio.dataset.prevDisplay || ''
          delete audio.dataset.prevDisplay
        }
      } catch {}
      window.removeEventListener('resize', updateImageMaxHeight)
      if (resizeObsRef.current) {
        try { resizeObsRef.current.disconnect() } catch {}
        resizeObsRef.current = null
      }
    }
  }, [isOpen, onClose, updateImageMaxHeight])

  if (!isOpen) return null

  return (
    <div id="overlay" className={isOpen ? '' : 'hidden'} onClick={onClose}>
      <div className="lightbox" onClick={(e) => e.stopPropagation()}>
        <button 
          className="close-button" 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 1001
          }}
        >
          ×
        </button>

        <div className={`lightbox-content${(imageCaption || imageDescription) ? ' has-text' : ''}`} ref={contentRef}>
          <div className="lightbox-image-container">
            <img 
              id="lightbox-image" 
              ref={imageRef}
              src={imageSrc} 
              alt="" 
              decoding="async"
              loading="eager"
              onLoad={() => {
                console.log('[Lightbox] image onLoad fired')
                updateImageMaxHeight()
              }}
              onError={() => console.log('[Lightbox] image onError', { src: imageSrc })}
            />
          </div>
          <div className="lightbox-text" ref={textRef}>
            {((imageCaption && String(imageCaption).trim()) || getFilenameCaption(imageSrc)) && (
              <h3 id="lightbox-caption">
                {(imageCaption && String(imageCaption).trim()) || getFilenameCaption(imageSrc)}
              </h3>
            )}
            {(imageDescription && String(imageDescription).trim()) && (
              <p id="lightbox-description">
                {imageDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 