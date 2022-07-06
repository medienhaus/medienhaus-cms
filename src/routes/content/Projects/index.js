import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { useTranslation } from 'react-i18next'
import DeleteProjectButton from './DeleteProjectButton'

import config from '../../../config.json'

const Content = ({ space, metaEvent, visibility, index, removeProject }) => {
  const history = useHistory()
  const { t } = useTranslation('content')
  const matrixClient = Matrix.getMatrixClient()
  const [showDeleteComponent, setShowDeleteComponent] = useState(false)
  console.log(space)
  return (
    <>
      <div className="project">
        <h3 className="above">{space.name}</h3>
        <figure className="left">
          {space.avatar_url && <img src={matrixClient.mxcUrlToHttp(space.avatar_url)} alt="project-visual-key" />}
        </figure>
        <div className="center">
          {/* @TODO grab description based on selected cms language */}
          <p>{space.topic || '❗️' + t('Please add a short description.')}</p>
        </div>
        <button disabled={showDeleteComponent} onClick={() => history.push(`/create/${space.room_id}`)}>{t('EDIT')}</button>
        <button disabled={showDeleteComponent} onClick={() => setShowDeleteComponent(true)}>{t('DELETE')}</button>
      </div>
      <aside className="project--status">
        {config.medienhaus?.item &&
          <span className="project--type">{t(config.medienhaus?.item ? config.medienhaus?.item[metaEvent.template]?.label.toUpperCase() : metaEvent.type.toUpperCase())}</span>}
        <span className="project--visibility">{t(metaEvent?.published.toUpperCase())}</span>
      </aside>
      {showDeleteComponent &&
        <DeleteProjectButton roomId={space.room_id} name={space.name} index={index} toggleDeleteButton={() => setShowDeleteComponent(false)} removeProject={removeProject} />}
    </>
  )
}

export default Content
