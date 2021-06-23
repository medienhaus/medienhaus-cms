import React, { useState } from 'react'
import { Loading } from '../../components/loading'

const FileUpload = (props) => {
  const [selectedFile, setSelectedFile] = useState()
  const [fileName, setFileName] = useState('')

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
            <input
              id="filename" type="text" value={fileName} onChange={e => {
                e.preventDefault()
                setFileName(e.target.value)
              }}
            />
          </div>
          <button className="upload" onClick={(e) => props.handleSubmission(e, selectedFile, fileName)} disabled={!selectedFile.type.includes(props.fileType) || selectedFile.size > size || props.loading}>{props.loading ? <Loading /> : 'Upload'}</button>
          {selectedFile.type.includes(props.fileType) || <section>Please select an {props.fileType} file.</section>}
          {selectedFile.size > size && <section style={{ color: 'red' }}> File size needs to be less than {size / 1000000}MB</section> // @Andi pls add to css
        }
        </>
      )}
      <input className="browse" type="file" name="browse" onChange={changeHandler} disabled={props.fileType === '' || false} />
    </>
  )
}
export default FileUpload
