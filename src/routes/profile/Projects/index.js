import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const Projects = ({ space, visibility, index, reloadProjects }) => {
  const [responseFromPublish, setResponseFromPublish] = useState();
  const history = useHistory()
  const matrixClient = Matrix.getMatrixClient()

  const deleteProject = (e, project) => {
    e.preventDefault()
    let space
    return new Promise(async (resolve, reject) => {
      try {
        space = await matrixClient.getSpaceSummary(project)
      } catch (err) {
        reject(new Error(err))
      }
      space.rooms.reverse().map(async (space, index) => {
        // we reverse here to leave the actual project space last in case something goes wrong in the process.
        console.log('Leaving ' + space.name)
        try {
          const count = await matrixClient.getJoinedRoomMembers(space.room_id)
          Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
            localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(space.room_id, name)
          })
          await matrixClient.leave(space.room_id)
        } catch (err) {
          console.error(err)
          reject(new Error(err))
        }
      })
      resolve('successfully deleted ' + project)
    })
  }

  const DeleteProjectButton = ({ roomId, name }) => {
    // dom not redrawing drafts after deletion is complete, needs to be fixed
    const [warning, setWarning] = useState(false)
    const [leaving, setLeaving] = useState(false)

    return (
      <>
        {warning && <p>Are you sure you want to delete the project <strong>{name}</strong>? This cannot be undone and will delete the project for you and any collaborator(s) that might be part of it.</p>}
        <input style={{ backgroundColor: 'red' }} // @Andi please add to css
          id="delete"
          name="delete"
          type="submit"
          value={warning ? 'Yes, delete project' : 'Delete project'}
          disabled={leaving}
          onClick={async (e) => {
            if (warning) {
              setLeaving(true)
              await deleteProject(e, roomId).catch(err => console.error(err)).then(() => reloadProjects(index, space)).then(() => setLeaving(false))
              setWarning(false)
            } else {
              e.preventDefault()
              setWarning(true)
            }
          }
          } />
        {leaving && <Loading />}

        {warning && <input
          id="delete"
          name="delete"
          type="submit"
          value={'CANCEL'}
          onClick={() => { setWarning(false) }}
        />}
      </>
    )
  }

  const onChangeVisibility = async () => {
    const req = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ join_rule: visibility === 'public' ? 'invite' : 'public' })
    }
    try {
      fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${space.room_id}/state/m.room.join_rules/`, req)
        .then(response => {
          console.log(response)
          if (response.ok) {
            reloadProjects(index, space)
          } else {
            setResponseFromPublish('Oh no, something went wrong.')
            setTimeout(() => {
              setResponseFromPublish()
            }, 3000)
          }
        })
    } catch (err) {
      console.error(err)
    }
  }

  console.log(space)
  return (
    <div style={{ display: 'flex' }}>
      {space.avatar_url && <img style={{ marginRight: '30px' }} src={matrixClient.mxcUrlToHttp(space.avatar_url)} alt="project-visual-key" />}
      <ul style={{ width: '100%' }}>
        <li><strong>{space.name}</strong></li>
        <li>Department: Gestaltung</li>
        <li>Program: Visuelle Kommunikation</li>
        <li>Division: New Media</li>
        <li>Supervisor: Prof. Jussi Ängeslevä</li>
        <li>Semester: Summer 2021</li>
      </ul>
      <div style={{ flexDirection: 'row', alignContent: 'space-around', padding: '30px' }}>
        <button onClick={() => history.push(`/submit/${space.room_id}`)}>EDIT</button>
        <LoadingSpinnerButton onClick={onChangeVisibility}>{responseFromPublish || visibility === 'public' ? 'Redact' : 'Publish'}</LoadingSpinnerButton>
        <DeleteProjectButton roomId={space.room_id} name={space.name} />
      </div>
    </div>
  )
}
export default Projects
