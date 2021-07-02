import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import PublishProject from '../../../components/PublishProject'

const Projects = ({ space, visibility, index, reloadProjects }) => {
  const history = useHistory()
  const matrixClient = Matrix.getMatrixClient()

  console.log(visibility);

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
              await deleteProject(e, roomId).catch(err => console.error(err)).then(() => reloadProjects(index, space, true)).then(() => setLeaving(false))
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

  console.log(space)
  return (
    <>
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
          <DeleteProjectButton roomId={space.room_id} name={space.name} />
          <PublishProject projectSpace={space.room_id} published={visibility} />
        </div>
      </div>
    </>
  )
}
export default Projects
