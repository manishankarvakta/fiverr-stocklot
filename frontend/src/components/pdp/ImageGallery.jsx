import React, { useState } from 'react';

const ImageGallery = ({ media = [] }) => {
  const images = media.filter(m => m.type === 'image');
  const videos = media.filter(m => m.type === 'video');
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length && !videos.length) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p>No images available</p>
        </div>
      </div>
    );
  }

  const allMedia = [...images, ...videos];
  
  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Main Image/Video - Mobile optimized */}
      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 bg-white">
        {allMedia[activeIndex] ? (
          allMedia[activeIndex].type === 'video' ? (
            <video 
              src={allMedia[activeIndex].url} 
              controls 
              className="w-full h-full object-cover"
              poster={allMedia[activeIndex].thumbnail}
            />
          ) : (
            <img 
              src={allMedia[activeIndex].url} 
              alt="Livestock" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          )
        ) : null}
        
        {/* Navigation Arrows - Touch friendly */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex(activeIndex > 0 ? activeIndex - 1 : allMedia.length - 1)}
              className="absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 lg:p-3 rounded-full hover:bg-opacity-70 transition-all touch-manipulation"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActiveIndex(activeIndex < allMedia.length - 1 ? activeIndex + 1 : 0)}
              className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 lg:p-3 rounded-full hover:bg-opacity-70 transition-all touch-manipulation"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image counter for mobile */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            {activeIndex + 1} / {allMedia.length}
          </div>
        )}
      </div>

      {/* Thumbnails - Responsive scrolling */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2 -mx-2 px-2">
          {allMedia.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                index === activeIndex 
                  ? 'border-green-500 ring-1 lg:ring-2 ring-green-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-4 h-4 lg:w-6 lg:h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <img 
                  src={item.url} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;