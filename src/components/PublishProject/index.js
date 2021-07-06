import React, { useEffect, useState } from 'react'
import LoadingSpinnerButton from '../LoadingSpinnerButton'
import { Loading } from '../loading'

const PublishProject = ({ space, published, index, callback }) => {
  const [userFeedback, setUserFeedback] = useState()
  const [visibility, setVisibility] = useState(published)
  const [showSaveButton, setShowSaveButton] = useState(false)

  useEffect(() => {
    setVisibility(published)
  }, [published])

  useEffect(() => {
    published === visibility && setShowSaveButton(false)
  }, [visibility, published])

  const onChangeVisibility = async () => {
    const req = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ join_rule: visibility === 'public' ? 'public' : 'invite' })
    }
    try {
      await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${space.room_id}/state/m.room.join_rules/`, req)
        .then(response => {
          console.log(response)
          if (response.ok) {
            setUserFeedback('Changed successfully!')
            setTimeout(() => {
              setUserFeedback()
              setShowSaveButton(false)
              callback && callback(index, space, false)
            }, 3000)
          } else {
            setUserFeedback('Oh no, something went wrong.')
            setTimeout(() => {
              setUserFeedback()
            }, 3000)
          }
        })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    visibility
      ? <>
      <select id="visibility" name="visibility" value={visibility} onChange={(e) => {
        setVisibility(e.target.value)
        setShowSaveButton(true)
      }} onBlur={(e) => { setVisibility(e.target.value) }}>
            <option value="invite">Draft</option>
            <option value="public">Public</option>
      </select>
      {showSaveButton && <div className="below">
        {userFeedback && <p>{userFeedback}</p>}
          {(visibility === 'public' && !space.description)
            ? <p>Please add a short description to your project</p>
            : <LoadingSpinnerButton disabled={(visibility === 'public' && !space.description)} onClick={onChangeVisibility}>SAVE</LoadingSpinnerButton>
    }
      </div>}
      </>
      : <Loading />
  )
}

export default PublishProject
