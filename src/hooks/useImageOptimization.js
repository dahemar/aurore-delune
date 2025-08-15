import { useEffect, useRef, useState } from 'react'

export function useImageOptimization(src, options = {}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef(null)
  const { 
    preload = false, 
    lazy = true, 
    threshold = 0.1,
    rootMargin = '50px'
  } = options

  useEffect(() => {
    if (!src || preload) {
      setIsLoaded(true)
      setIsInView(true)
      return
    }

    const img = imgRef.current
    if (!img) return

    // Intersection Observer for lazy loading
    if (lazy && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true)
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold, rootMargin }
      )

      observer.observe(img)
      return () => observer.disconnect()
    } else {
      // Fallback for older browsers
      setIsInView(true)
    }
  }, [src, preload, lazy, threshold, rootMargin])

  useEffect(() => {
    if (!isInView) return

    const img = imgRef.current
    if (!img) return

    // Preload image
    const preloadImg = new Image()
    
    preloadImg.onload = () => {
      setIsLoaded(true)
      if (imgRef.current) {
        imgRef.current.classList.add('loaded')
      }
    }

    preloadImg.onerror = () => {
      console.warn('Failed to load image:', src)
      setIsLoaded(true) // Still mark as loaded to show fallback
    }

    preloadImg.src = src
  }, [isInView, src])

  return {
    ref: imgRef,
    isLoaded,
    isInView,
    className: preload ? 'preload' : ''
  }
}

// Hook for preloading critical images
export function useImagePreload(imageUrls) {
  useEffect(() => {
    if (!Array.isArray(imageUrls)) return

    imageUrls.forEach(url => {
      if (!url) return
      
      const img = new Image()
      img.src = url
      // Don't wait for load, just start the request
    })
  }, [imageUrls])
}
