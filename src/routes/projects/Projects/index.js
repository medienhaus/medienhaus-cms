import React from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import PublishProject from '../../../components/PublishProject'
import { useTranslation } from 'react-i18next'
import DeleteProjectButton from './DeleteProjectButton'

const Projects = ({ space, visibility, index, reloadProjects }) => {
  const history = useHistory()
  const { t } = useTranslation('projects')
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

  return (
    <>
      <div className="project">
        <h3 className="above">{space.name}</h3>
        <figure className="left">
          {space.avatar_url && <img src={matrixClient.mxcUrlToHttp(space.avatar_url)} alt="project-visual-key" />}
        </figure>
        <div className="center">
          <p>{space.description || t('Please add a short description of your project.')}</p>
        </div>
        {/*
        <div className="right">
        */}
          <button onClick={() => history.push(`/submit/${space.room_id}`)}>{t('EDIT')}</button>
          <PublishProject space={space} published={visibility} index={index} description={space.description} callback={reloadProjects} />
          <DeleteProjectButton roomId={space.room_id} name={space.name} index={index} deleteProject={deleteProject} reloadProject={reloadProjects} />

        {/*
        </div>
        */}
      </div>
    </>
  )
}
export default Projects
