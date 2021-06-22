import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import FileUpload from '../../../components/FileUpload';

const ProjectImage = ({projectSpace}) => {

    const [loading, setLoading] = useState(false);
    const matrixClient = Matrix.getMatrixClient()

    const handleSubmission = async (e, selectedFile, fileName) => {
        e.preventDefault()
        setLoading(true)
        try {
          await matrixClient.uploadContent(selectedFile, { name: fileName })
            .then( (url) => {
                fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.room.avatar/`, { "url": url })
              }).then(console.log)
            setLoading(false)
            //setCounter(0)
           //})
  
        } catch (e) {
          console.log('error while trying to save image: ' + e)
        } finally {
          setLoading(false)
        }
      }
    
    return (
        <div>
        Add a project image
        <FileUpload fileType={'image'} handleSubmission={handleSubmission} loading={loading} />
        </div>
    )
}
export default ProjectImage