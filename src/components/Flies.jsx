import { useEffect, useRef } from 'react'

const NUM_FLIES = 5
const base = import.meta.env.BASE_URL

export default function Flies({ enabled = true, activateOnClick = false }) {
  const startedRef = useRef(false)
  const createdRef = useRef(false)
  const timersRef = useRef([])

  useEffect(() => {
    function createFlies() {
      if (createdRef.current) return
      createdRef.current = true
      for (let i = 0; i < NUM_FLIES; i++) {
        const fly = document.createElement('img')
        fly.src = `${base}images/fly.gif`
        fly.style.position = 'fixed'
        fly.style.top = '0'
        fly.style.left = '0'
        fly.style.width = '30px'
        fly.style.zIndex = '9999'
        fly.style.pointerEvents = 'none'
        fly.style.willChange = 'transform'
        fly.classList.add('fly')
        // start exactly at top-left like the original
        fly.style.transform = 'translate(0px, 0px)'
        document.body.appendChild(fly)
      }
    }

    function moveOnce(fly) {
      const x = Math.random() * window.innerWidth
      const y = Math.random() * window.innerHeight
      const duration = 3 + Math.random() * 3
      fly.style.transition = `transform ${duration}s linear`
      fly.style.transform = `translate(${x}px, ${y}px)`
      const t = setTimeout(() => moveOnce(fly), duration * 1000)
      timersRef.current.push(t)
    }

    function start() {
      if (startedRef.current) return
      startedRef.current = true
      document.querySelectorAll('img.fly').forEach((fly) => moveOnce(fly))
    }

    function destroyFlies() {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      startedRef.current = false
      createdRef.current = false
      document.querySelectorAll('img.fly').forEach((fly) => fly.remove())
    }

    if (!enabled) {
      destroyFlies()
      return
    }

    createFlies()

    if (activateOnClick) {
      const handler = (e) => {
        if (e.target.closest('button, a, input, select, textarea, label')) return
        start()
        document.removeEventListener('click', handler)
      }
      document.addEventListener('click', handler)
      return () => {
        document.removeEventListener('click', handler)
        destroyFlies()
      }
    } else {
      // Iniciar inmediatamente después de crear las moscas
      setTimeout(() => start(), 100) // Pequeño delay para asegurar que las moscas estén en el DOM
      return () => destroyFlies()
    }
  }, [enabled, activateOnClick])

  return null
} 