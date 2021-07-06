import React, { useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import PublishProject from '../../../components/PublishProject'

const Projects = ({ space, visibility, index, reloadProjects }) => {
  const history = useHistory()
  const matrixClient = Matrix.getMatrixClient()

  const deleteProject = async (e, project) => {
    e.preventDefault()
    let space
    try {
      space = await matrixClient.getSpaceSummary(project)
    } catch (err) {
      console.error(err)
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
      }
    })
    return 'successfully deleted ' + project
  }

  const DeleteProjectButton = ({ roomId, name }) => {
    const [warning, setWarning] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const isMounted = useRef(true)

    useEffect(() => {
      // needed to add this cleanup useEffect to prevent memory leaks
      isMounted.current = true
      return () => {
        isMounted.current = false
      }
    }, [])

    return (
      <>
        {warning && <p>Are you sure you want to delete the project <strong>{name}</strong>? This cannot be undone and will delete the project for you and any collaborator(s) that might be part of it.</p>}
        <input
          id="delete"
          name="delete"
          type="submit"
          value={warning ? 'Yes, delete project' : 'DELETE'}
          disabled={leaving}
          onClick={async (e) => {
            if (warning) {
              setLeaving(true)
              await deleteProject(e, roomId)
                .then(() => reloadProjects(index, space, true))
                .catch(err => console.log(err))
                .finally(() => {
                  if (isMounted.current) {
                    setLeaving(false)
                  }
                })
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

  return (
    <>
      <div className="project">
        <h3 className="above">{space.name}</h3>
        <figure className="left">
          {space.avatar_url && <img src={matrixClient.mxcUrlToHttp(space.avatar_url)} alt="project-visual-key" />}
        </figure>
        <div className="center">
          <p>{space.description || 'Please add a short description to your project.'}</p>
        </div>
        {/*
        <div className="right">
        */}
          <button onClick={() => history.push(`/submit/${space.room_id}`)}>EDIT</button>
          <DeleteProjectButton roomId={space.room_id} name={space.name} />
          <PublishProject space={space} published={visibility} index={index} description={space.description} callback={reloadProjects} />
        {/*
        </div>
        */}
      </div>
    </>
  )
}
export default Projects
