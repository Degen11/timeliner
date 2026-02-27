import { useState, useCallback } from 'react'
import { ImagePlus, X } from 'lucide-react'

export default function PhotoUpload({ photos, onPhotosChange }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (fileList) => {
      const newPhotos = Array.from(fileList)
        .filter((f) => f.type.startsWith('image/'))
        .map((file) => ({
          file,
          name: file.name,
          objectUrl: URL.createObjectURL(file),
        }))
      onPhotosChange([...photos, ...newPhotos])
    },
    [photos, onPhotosChange]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const removePhoto = useCallback(
    (index) => {
      const updated = photos.filter((_, i) => i !== index)
      URL.revokeObjectURL(photos[index].objectUrl)
      onPhotosChange(updated)
    },
    [photos, onPhotosChange]
  )

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-900">
        Photos <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging
            ? 'border-accent bg-accent-light/50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <ImagePlus size={24} className="text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          Drag & drop photos here, or{' '}
          <label className="text-accent cursor-pointer hover:underline">
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
              className="relative group rounded-md overflow-hidden border border-gray-200"
            >
              <img
                src={photo.objectUrl}
                alt={photo.name}
                className="h-16 w-16 object-cover"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 rounded-full bg-gray-900/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${photo.name}`}
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gray-900/60 px-1 py-0.5">
                <p className="text-[10px] text-white truncate">{photo.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
