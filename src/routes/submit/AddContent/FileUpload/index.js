import React, {useState} from 'react'
import Matrix from '../../../../Matrix'
import createBlock from '../../matrix_create_room'
import reorder from '../../DisplayContent/matrix_reorder_rooms'
import { Loading } from '../../../../components/loading'


const FileUpload = (props) => {
    const [selectedFile, setSelectedFile] = useState();
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const matrixClient = Matrix.getMatrixClient()
    const size = props.fileType === 'image' ? 5000000 : 25000000

    const changeHandler = (event) => {
      setSelectedFile(event.target.files[0])
      console.log(selectedFile)
      setFileName(event.target.files[0].name)
      // setIsFilePicked(true);
    }
    console.log(props);
    const handleSubmission = async (e) => {
      e.preventDefault()
      setLoading(true)
      try {
        await matrixClient.uploadContent(selectedFile, { name: fileName })
          .then(async (url) => {
            props.blocks.forEach((block, i) => {
              if (i >= props.number) {
              console.log(block.name);
              reorder(block.name, block.room_id, false)
              }
          })
              const room = await createBlock(e, props.fileType, props.number, props.space)
              console.log("room = " + room);
            return [url, room]
            }).then((res) =>
            props.fileType === "image" ?
              matrixClient.sendImageMessage(res[1], res[0], {
              mimetype: selectedFile.type,
                size: selectedFile.size,
              name: selectedFile.name
              }) : matrixClient.sendMessage(res[1], {
                "body": selectedFile.name,
                "info": {
                  "size": selectedFile.size,
                  "mimetype": selectedFile.type
                }, "msgtype": "m.audio",
                "url": res[0]
              })
              )
              .then(console.log)
          setFileName()
          setSelectedFile('')
          props.displayPlusButton(true)
          props.reloadProjects('callback from FileUpload component')

          //setCounter(0)
         //})

      } catch (e) {
        console.log('error while trying to save image: ' + e)
      } finally {
        setLoading(false)
      }
    }

    selectedFile && console.log(selectedFile);
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
          <button className="upload" onClick={(e) => handleSubmission(e)} disabled={!selectedFile.type.includes(props.fileType) || selectedFile.size > size || loading}>{loading ? <Loading /> : "Upload"}</button>
          {selectedFile.type.includes(props.fileType) || <section>Please select an {props.fileType} file.</section>}
          {selectedFile.size > size && <section style={{ color: "red" }}> File size needs to be less than {size / 1000000}MB</section> //@Andi pls add to css
        }
        </>
        )
         }
        <input className="browse" type="file" name="browse" onChange={changeHandler} disabled={props.fileType === "" || false} />
      </>)
}

export default FileUpload
