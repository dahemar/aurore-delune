import { useEffect, useRef } from 'react'

const base = import.meta.env.BASE_URL

export default function FloatingGallery({ items }) {
  const galleryRef = useRef(null)
  const animRef = useRef({ draggingFigure: null, offsetX: 0, offsetY: 0, currentX: 0, currentY: 0, targetX: 0, targetY: 0, frame: 0, zTop: 10 })

  useEffect(() => {
    const gallery = galleryRef.current
    if (!gallery) return

    // Randomize initial positions of all figures on each load
    const randomizePositions = () => {
      const figures = gallery.querySelectorAll('figure')
      const positions = []
      const isMobile = window.innerWidth <= 768
      const minDistance = isMobile ? 120 : 160 // más separación en móvil
      
      // Altura extra en móvil para distribuir mejor verticalmente
      const viewportH = window.innerHeight
      const canvasH = isMobile ? Math.round(viewportH * 1.1) : viewportH
      gallery.style.height = `${canvasH}px`
      
      figures.forEach((fig) => {
        const isBig = fig.classList.contains('big-figure')
        const approxWidth = isBig ? 350 : 250
        const safeMargin = isMobile ? 40 : 80
        const maxX = Math.max(0, window.innerWidth - approxWidth - safeMargin)
        const maxY = Math.max(0, canvasH - 300) // rango vertical ampliado
        
        let attempts = 0
        let validPosition = false
        let left, top
        
        // Intentar encontrar una posición válida que no esté muy cerca de otras
        while (!validPosition && attempts < 200) { // más intentos
          left = Math.random() * maxX
          top = Math.random() * maxY
          
          // Verificar que esté a una distancia mínima de otras imágenes
          validPosition = positions.every(pos => {
            const distance = Math.sqrt(
              Math.pow(left - pos.left, 2) + Math.pow(top - pos.top, 2)
            )
            return distance >= minDistance
          })
          
          attempts++
        }
        
        // Si no se encontró posición válida, usar la última generada
        fig.style.left = `${Math.max(safeMargin, Math.min(left, maxX))}px`
        fig.style.top = `${Math.max(safeMargin, Math.min(top, maxY))}px`
        
        // Guardar la posición para futuras verificaciones
        positions.push({ left, top })
      })
    }

    randomizePositions()

    function startDrag(e) {
      const state = animRef.current
      const isTouch = e.type.startsWith('touch')
      const pointer = isTouch ? e.touches[0] : e
      const fig = document.elementFromPoint(pointer.clientX, pointer.clientY)?.closest('figure')
      if (!fig || !gallery.contains(fig)) return
      state.draggingFigure = fig
      const rect = fig.getBoundingClientRect()
      const galleryRect = gallery.getBoundingClientRect()
      state.offsetX = pointer.clientX - rect.left
      state.offsetY = pointer.clientY - rect.top
      fig.style.cursor = 'grabbing'
      fig.style.zIndex = String(++state.zTop)
      state.targetX = rect.left - galleryRect.left
      state.targetY = rect.top - galleryRect.top
      state.currentX = state.targetX
      state.currentY = state.targetY

      if (isTouch) {
        document.addEventListener('touchmove', onDrag, { passive: false })
        document.addEventListener('touchend', endDrag)
      } else {
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseup', endDrag)
      }
      animate()
    }

    function onDrag(e) {
      const state = animRef.current
      if (!state.draggingFigure) return
      const isTouch = e.type.startsWith('touch')
      const pointer = isTouch ? e.touches[0] : e
      const galleryRect = gallery.getBoundingClientRect()
      
      // Allow images to go beyond container boundaries
      let newX = pointer.clientX - galleryRect.left - state.offsetX
      let newY = pointer.clientY - galleryRect.top - state.offsetY
      
      // Allow negative values to go beyond left and top edges
      // Only limit extreme values to prevent images from going too far off-screen
      newX = Math.max(-200, Math.min(newX, window.innerWidth - 50))
      newY = Math.max(-200, Math.min(newY, window.innerHeight * 1.1 - 50))
      
      state.targetX = newX
      state.targetY = newY
      if (isTouch) e.preventDefault()
    }

    function animate() {
      const state = animRef.current
      if (!state.draggingFigure) return
      state.currentX += (state.targetX - state.currentX) * 0.35
      state.currentY += (state.targetY - state.currentY) * 0.35
      state.draggingFigure.style.left = `${state.currentX}px`
      state.draggingFigure.style.top = `${state.currentY}px`
      state.frame = requestAnimationFrame(animate)
    }

    function endDrag() {
      const state = animRef.current
      if (state.draggingFigure) {
        state.draggingFigure.style.cursor = 'grab'
        state.draggingFigure = null
      }
      cancelAnimationFrame(state.frame)
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', endDrag)
      document.removeEventListener('touchmove', onDrag)
      document.removeEventListener('touchend', endDrag)
    }

    gallery.addEventListener('mousedown', startDrag)
    gallery.addEventListener('touchstart', startDrag, { passive: false })
    return () => {
      gallery.removeEventListener('mousedown', startDrag)
      gallery.removeEventListener('touchstart', startDrag)
    }
  }, [])

  // tamaños responsive usando clamp para móvil/desktop
  const figStyle = { position: 'absolute', width: 'clamp(120px, 28vw, 250px)', margin: 0, cursor: 'grab', userSelect: 'none' }
  const bigStyle = { ...figStyle, width: 'clamp(150px, 34vw, 350px)' }
  const imgStyle = { width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }
  const capStyle = { color: '#fff', textShadow: '0 1px 2px #000', background: 'rgba(0,0,0,0.35)', padding: '4px 6px', borderRadius: 4, fontSize: '1.1rem' }
  const capStyleBig = { ...capStyle, fontSize: '1.3rem', fontWeight: 'bold' }

  const defaultItems = [
    { src: `${base}images/610c1761-8c76-4285-99ae-10ce1a644614.jpg`, caption: 'But the trees spread darkness for a wandering beam of sun', size: 'normal' },
    { src: `${base}images/38340221-c73f-4f8a-a87a-3a18bcc629a6.jpg`, caption: 'The Sick Garden', size: 'big' },
    { src: `${base}images/frog.jpeg`, caption: 'In memoriam', size: 'normal' },
    { src: `${base}images/P1082183.JPG`, caption: 'Sacrifice', size: 'normal' },
  ]

  const renderItems = (items && items.length ? items : defaultItems)

  // altura del contenedor: más alta en móvil
  const isMobileRender = typeof window !== 'undefined' && window.innerWidth <= 768

  return (
    <div
      className="floating-gallery"
      id="floating-gallery"
      ref={galleryRef}
      style={{ position: 'relative', width: '100%', height: isMobileRender ? '110vh' : '100vh', overflow: 'visible', cursor: 'grab', margin: '0 auto', padding: 0 }}
    >
      {renderItems.map((item, idx) => {
        const isBig = String(item.size).toLowerCase() === 'big'
        return (
          <figure key={idx} className={isBig ? 'big-figure' : ''} style={{ ...(isBig ? bigStyle : figStyle) }}>
            <img src={item.src} alt="" draggable={false} style={imgStyle} />
            <figcaption style={isBig ? capStyleBig : capStyle}>{item.caption}</figcaption>
          </figure>
        )
      })}
    </div>
  )
} 