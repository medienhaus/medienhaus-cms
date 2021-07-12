import React, { useState } from 'react'
import Matrix from '../../../../Matrix'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'

const DisplayImage = ({ roomId, url, alt }) => {
  const [license, setLicense] = useState('')
  const [author, setAuthor] = useState('')
  const [alttext, setAlttext] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const matrixClient = Matrix.getMatrixClient()

  const onSave = async () => {
    setLoading(true)
    await matrixClient.sendStateEvent(roomId, 'm.medienhaus.meta', {
      rundgang: 21,
      type: 'image',
      imageMeta: {
        author: author,
        alt: alttext,
        license: license
      },
      version: '0.1'
    })
    setFeedback('Saved succesfully!')
    setTimeout(() => {
      setFeedback('')
    }, 3000)
    setLoading(false)
  }
  return (<>
        <figure className="center"><img src={url} alt={alt} /></figure>
        <input type="text" placeholder="author, credits, et cetera" onChange={(e) => setAuthor(e.target.value)} />
        <select id="license" name="license" defaultValue={''} value={license} onChange={(e) => setLicense(e.target.value)}>
            <option value="" disabled={true}>-- SELECT LICENSE --</option>
            <option value="CC0 1.0">– CC0 1.0 (public domain)</option>
            <option value="CC BY 4.0">– CC BY 4.0 (+credit to creator)</option>
            <option value="CC BY-SA 4.0">– CC BY-SA 4.0 (+credit to creator)</option>
            <option value="CC BY-NC 4.0">– CC BY-NC 4.0 (+credit to creator)</option>
            <option value="CC BY-NC-SA 4.0">– CC BY-NC-SA 4.0 (+credit to creator)</option>
            <option value="CC BY-ND 4.0">– CC BY-ND 4.0 (+credit to creator)</option>
            <option value="CC BY-NC-ND 4.0">– CC BY-NC-ND 4.0 (+credit to creator)</option>
            <option value="CC">- In Copyright</option>
        </select>
        <a href="https://chooser-beta.creativecommons.org/">https://chooser-beta.creativecommons.org/</a>
        <textarea placeholder="please describe the image with a few words to enable visually impaired website visitors to comprehend what’s being shown here"
            onChange={(e) => setAlttext(e.target.value)} />
        <LoadingSpinnerButton disabled={loading || alttext.length < 0 || license.length < 0 || author.length < 0 } onClick={onSave} >{feedback || 'SAVE'}</LoadingSpinnerButton>
    </>
  )
}
export default DisplayImage