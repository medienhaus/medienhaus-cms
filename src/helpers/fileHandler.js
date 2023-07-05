import config from '../config.json'

export const fileHandler = (file, fileType) => {
  const maxFileSize = fileType === 'image' ? (config.medienhaus.limits?.maxImageSize || 5000000) : (config.medienhaus.limits?.maxAudioSize || 25000000)

  const promise = new Promise((resolve, reject) => {
    if (!file) reject(new Error('file type error'))
    // we check if the selected file type matches the type we expect
    if (!file.type.includes(fileType)) reject(new Error('file type does not match expected type', { details: `expected ${fileType}, received ${file.type}` }))
    // reject if fil size is too large
    if (file.size > maxFileSize) reject(new Error('File size needs to be less than ' + maxFileSize / 1000000 + 'MB'))

    // if the file is an image we check its dimensions
    if (file.type.includes('image')) {
      const reader = new FileReader()
      // Read the contents of Image File.
      reader.readAsDataURL(file)
      reader.onload = function (e) {
      // Initiate the JavaScript Image object.
        const image = new Image()
        // Set the Base64 string return from FileReader as source.
        image.src = e.target.result
        // Validate the File Height and Width.
        image.onload = function () {
          const height = this.height
          const width = this.width
          const maxDimensions = config.medienhaus.limits?.maxAvatarDimensions || 3000
          // reject if height/width exceeds our limitations
          if (height > maxDimensions || width > maxDimensions) reject(new Error('Height and width must not exceed ' + (config.medienhaus.limits?.maxAvatarDimensions || '3000') + ' pixels'))
          // if all checks passed we can resolve the promise
          else resolve(true)
        }
        image.onerror = reject
      }
    } else {
      // no further checks yet for other file types therefore resolve.
      resolve(true)
    }
  })
  return promise
}
