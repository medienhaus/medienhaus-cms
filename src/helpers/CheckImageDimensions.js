import config from '../config.json'

export const checkImageDimensions = (file) => {
  const promise = new Promise((resolve, reject) => {
    if (!file) reject(new Error('file type error'))
    const reader = new FileReader()
    if (!file.type.includes('image')) reject(new Error('file type does not match type image'))
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
        if (height > maxDimensions || width > maxDimensions) reject(new Error('Height and width must not exceed ' + (config.medienhaus.limits?.maxAvatarDimensions || '3000') + 'px'))
        else resolve(true)
      }
      image.onerror = reject
    }
  })
  return promise
}
