import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function HoverTrail() {
  const location = useLocation()
  const activeWordRef = useRef('')
  const mousePosRef = useRef({ x: 0, y: 0 })
  const intervalRef = useRef(null)

  useEffect(() => {
    function wrapWords(selector) {
      document.querySelectorAll(selector).forEach((el) => {
        if (!el || el.dataset.wrapped === 'true') return
        const text = (el.textContent || '').trim()
        if (!text) return
        const words = text.split(/\s+/)
        el.innerHTML = words.map((w) => `<span class="hover-word">${w}</span>`).join(' ')
        el.dataset.wrapped = 'true'
      })
    }

    wrapWords('h1, h2:not(.type-h2)')

    function onMouseOver(e) {
      const span = e.target.closest('.hover-word')
      if (span) {
        activeWordRef.current = span.textContent || ''
      }
    }
    function onMouseMove(e) {
      mousePosRef.current.x = e.pageX
      mousePosRef.current.y = e.pageY
    }

    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mousemove', onMouseMove)

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const word = activeWordRef.current
      if (!word) return
      const { x, y } = mousePosRef.current
      const trail = document.createElement('span')
      trail.className = 'trail'
      trail.textContent = word
      trail.style.left = x + 'px'
      trail.style.top = y + 'px'
      document.body.appendChild(trail)
      setTimeout(() => trail.remove(), 1000)
    }, 50)

    return () => {
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mousemove', onMouseMove)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [location.pathname])

  return null
} 