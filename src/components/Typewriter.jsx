import { useEffect, useRef } from 'react'

export default function Typewriter({ text = '', speed = 50, startDelay = 300, className = 'type-h2' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !text) return
    el.innerHTML = ''
    let i = 0
    const timer = setTimeout(function type() {
      if (i < text.length) {
        const ch = text[i++]
        const span = document.createElement('span')
        span.dataset.char = ch
        span.textContent = ch
        el.appendChild(span)
        setTimeout(type, speed)
      }
    }, startDelay)
    return () => clearTimeout(timer)
  }, [text, speed, startDelay])

  return <h2 ref={ref} className={className} data-text={text} />
} 