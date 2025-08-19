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
        
        <img 
          id="lightbox-image" 
          src={imageSrc} 
          alt="" 
          style={{
            maxWidth: '90%',
            maxHeight: '70vh',
            border: '5px solid white',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        />
        
        {imageCaption && (
          <h3 id="lightbox-caption" style={{
            fontSize: '1.5rem',
            color: 'white',
            margin: '20px 0 10px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            {imageCaption}
          </h3>
        )}
        
        {imageDescription && (
          <p id="lightbox-description" style={{
            fontSize: '1.1rem',
            color: 'white',
            margin: '0 0 20px 0',
            maxWidth: '600px',
            lineHeight: '1.6',
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}>
            {imageDescription}
          </p>
        )}
      </div>
    </div>
  )
} 