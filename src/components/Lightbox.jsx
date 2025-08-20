import { useEffect } from 'react'

export default function Lightbox({ isOpen, imageSrc, imageCaption, imageDescription, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

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

        <div className="lightbox-content">
          <div className="lightbox-image-container">
            <img 
              id="lightbox-image" 
              src={imageSrc} 
              alt="" 
            />
          </div>
          <div className="lightbox-text">
            {imageCaption && (
              <h3 id="lightbox-caption">
                {imageCaption}
              </h3>
            )}
            {imageDescription && (
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