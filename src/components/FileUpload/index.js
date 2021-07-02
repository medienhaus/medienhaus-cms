import React, { useState } from 'react'
import { Loading } from '../../components/loading'

const FileUpload = (props) => {
  const [selectedFile, setSelectedFile] = useState()
  const [fileName, setFileName] = useState('')
  const [license, setLicense] = useState('');

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
          <div className="filename">
            <label htmlFor="filename">Filename:</label>
            <input id="filename" type="text" value={fileName} onChange={e => {
              e.preventDefault()
              setFileName(e.target.value)
            }} />

          </div>
          <input type="text" placeholder="Author" />
          <select id="license" name="license" defaultValue={''} value={license} onChange={(e) => setLicense(e.target.value)}>
            <option value="" disabled={true}>-- SELECT LICENSE --</option>
          </select>
          <textarea placeholder="please describe the image with some words to enable visually impaired website visitors to comprehend what’s being shown here" />


          <button className="upload" onClick={(e) => props.handleSubmission(e, selectedFile, fileName)} disabled={!selectedFile.type.includes(props.fileType) || selectedFile.size > size || props.loading}>{props.loading ? <Loading /> : 'Upload'}</button>
          {selectedFile.type.includes(props.fileType) || <section>Please select an {props.fileType} file.</section>}
          {selectedFile.size > size && <section style={{ color: 'red' }}> File size needs to be less than {size / 1000000}MB</section>
          }

        </>
      )
      }
      <input className="browse" type="file" name="browse" onChange={changeHandler} disabled={props.fileType === '' || false} />
    </>
  )
}
export default FileUpload
