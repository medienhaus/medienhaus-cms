import React, { useState } from 'react'
import { Loading } from '../../components/loading'

const FileUpload = (props) => {
  const [selectedFile, setSelectedFile] = useState()
  const [fileName, setFileName] = useState('')
  const [author, setAuthor] = useState('')
  const [license, setLicense] = useState('')
  const [alttext, setAlttext] = useState('')
  const size = props.fileType === 'image' ? 5000000 : 25000000

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0])
    console.log(selectedFile)
    setFileName(event.target.files[0].name)
  }

  return (
    <>
      {selectedFile && (
        <>
        <input type="text" placeholder="Author" onChange={(e) => setAuthor(e.target.value)} />
        <textarea placeholder="please describe the image with a few words to enable visually impaired website visitors to comprehend what’s being shown here"
            onChange={(e) => setAlttext(e.target.value)} />
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
          <button className="upload" onClick={(e) => props.handleSubmission(e, selectedFile, fileName, author, license, alttext)} disabled={!selectedFile.type.includes(props.fileType) || selectedFile.size > size || props.loading || alttext.length < 1 || license.length < 1 || author.length < 1}>{props.loading ? <Loading /> : 'Upload'}</button>
          {selectedFile.type.includes(props.fileType) || <section>Please select an {props.fileType} file.</section>}
          {selectedFile.size > size && <section style={{ color: 'red' }}> File size needs to be less than {size / 1000000}MB</section>
          }

        </>
      )
      }
      <input className="browse" type="file" name="browse" onChange={changeHandler} disabled={props.fileType === '' || false } />
    </>
  )
}
export default FileUpload
