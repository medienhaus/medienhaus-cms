import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import PublishProject from '../../../components/PublishProject'
import { useTranslation } from 'react-i18next'
import DeleteProjectButton from './DeleteProjectButton'

const Projects = ({ space, visibility, index, reloadProjects }) => {
  const history = useHistory()
  const { t } = useTranslation('projects')
  const matrixClient = Matrix.getMatrixClient()
  const [showDeleteComponent, setShowDeleteComponent] = useState(false)

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
          <button disabled={showDeleteComponent} onClick={() => history.push(`/submit/${space.room_id}`)}>{t('EDIT')}</button>
          <button disabled={showDeleteComponent} onClick={() => setShowDeleteComponent(true)}>DELETE</button>
          <PublishProject disabled={showDeleteComponent} space={space} published={visibility} index={index} description={space.description} callback={reloadProjects} />
        {/*
        </div>
        */}
      </div>
    {showDeleteComponent &&
        <DeleteProjectButton roomId={space.room_id} name={space.name} index={index} toggleDeleteButton={() => setShowDeleteComponent(false)} reloadProject={reloadProjects} />
    }
    </>
  )
}
export default Projects
