import React from 'react'

function StackedGallery({ items, onImageClick }) {
  console.log('StackedGallery - Received items:', items)
  console.log('StackedGallery - items.length:', items?.length)
  
  if (!items || items.length === 0) {
    console.log('StackedGallery - No items, returning null')
    return null
  }

  return (
    <div className="stacked-gallery">
      {console.log('StackedGallery - Rendering gallery with', items.length, 'items')}
      {items.map((item, index) => {
        console.log('StackedGallery - Rendering item', index, ':', item)
        return (
          <div key={index} className="stacked-image-container">
            <img
              src={item.src}
              alt=""
              className="stacked-image"
              onClick={() => onImageClick(item)}
              style={{ cursor: 'pointer' }}
            />
            {item.caption && (
              <figcaption className="stacked-caption">
                {item.caption}
              </figcaption>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default StackedGallery
