import { useState, useEffect, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'

export default function PhotoUpload({ photos, onPhotosChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const objectUrlsRef = useRef([])

  // Track all created object URLs and revoke on unmount
  useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const handleFiles = (fileList) => {
    const newPhotos = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => {
        const objectUrl = URL.createObjectURL(file)
        objectUrlsRef.current.push(objectUrl)
        return { file, name: file.name, objectUrl }
      })
    onPhotosChange([...photos, ...newPhotos])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index)
    URL.revokeObjectURL(photos[index].objectUrl)
    onPhotosChange(updated)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-900">
        Photos <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all ${
          isDragging
            ? 'border-secondary bg-soft-accent/50'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'
        }`}
      >
        <ImagePlus size={24} className="text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          Drag & drop photos here, or{' '}
          <label className="text-secondary cursor-pointer hover:underline">
            browse
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Filenames with dates or names help with matching
        </p>
      </div>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {photos.map((photo, i) => (
            <div
              key={photo.name + i}
              className="relative group rounded-lg overflow-hidden border border-gray-200"
            >
              <img src={photo.objectUrl} alt={photo.name} className="h-16 w-16 object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 rounded-full bg-gray-900/60 p-0.5 text-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus-visible:opacity-100 transition-opacity"
                aria-label={`Remove ${photo.name}`}
              >
                <X size={12} />
              </button>
              <div
                className="absolute bottom-0 left-0 right-0 bg-gray-900/60 px-1 py-0.5"
                title={photo.name}
              >
                <p className="text-[11px] text-white truncate">{photo.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
