import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { useTranslation } from 'react-i18next'
import DeleteProjectButton from './DeleteProjectButton'

import config from '../../../config.json'

const Content = ({ space, metaEvent, visibility, index, removeProject, displayStyle }) => {
  const history = useHistory()
  const { t } = useTranslation('content')
  const matrixClient = Matrix.getMatrixClient()
  const [showDeleteComponent, setShowDeleteComponent] = useState(false)

  return (

    <>
      {displayStyle === 'grid' &&
        <>
          <div className="project">
            <h3 className="above">{space.name}
              <span style={{ color: 'gray' }}> {metaEvent?.published.toUpperCase()}</span>
              {config.medienhaus?.item &&
                <span style={{ color: 'gray', float: 'right' }}>{config.medienhaus?.item ? config.medienhaus?.item[metaEvent.template]?.label.toUpperCase() : metaEvent.type.toUpperCase()}</span>}
            </h3>
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

          {showDeleteComponent &&
            <DeleteProjectButton roomId={space.room_id} name={space.name} index={index} toggleDeleteButton={() => setShowDeleteComponent(false)} removeProject={removeProject} />}
        </>}
      {displayStyle === 'list' &&
        <>
          <div className="projectSmall">
            <h3 className="above">{space.name}</h3>
            <div>
              <button disabled={showDeleteComponent} onClick={() => history.push(`/create/${space.room_id}`)}>✏️</button>
              <button disabled={showDeleteComponent} onClick={() => setShowDeleteComponent(true)}>🗑️</button>
            </div>
          </div>
        </>}
    </>

  )
}

export default Content
