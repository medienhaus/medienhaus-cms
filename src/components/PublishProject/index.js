import React, { useEffect, useState } from 'react'
import LoadingSpinnerButton from '../LoadingSpinnerButton'
import { Loading } from '../loading'

const PublishProject = ({ space, published, index, callback }) => {
  const [userFeedback, setUserFeedback] = useState()
  const [visibility, setVisibility] = useState(published)
  const [showConsentBox, setShowConsentBox] = useState(false)
  const [showSaveButton, setShowSaveButton] = useState(false)
  const [consent, setConsent] = useState(false)
  console.log(space)
  useEffect(() => {
    setVisibility(published)
  }, [published])

  useEffect(() => {
    published === visibility && setShowSaveButton(false)
    published === 'public' && setShowConsentBox(false)
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
              setShowConsentBox(false)
              setConsent(false)
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
        e.target.value === 'public'
          ? setShowConsentBox(true)
          : setShowConsentBox(false)
        setShowSaveButton(true)
        setConsent(false)
      }} onBlur={(e) => { setVisibility(e.target.value) }}>
            <option value="invite">Draft</option>
            <option value="public">Public</option>
      </select>
      {showSaveButton && <div className="below">
        {userFeedback && <p>{userFeedback}</p>}
        {showConsentBox && (visibility === 'public' && !space.topic.complete)
          ? <p>Please add a short description to your project</p>
          : <div>
          <input id="checkbox" name="checkbox" type="checkbox" value={consent} onChange={() => setConsent(consent => !consent)} />
          <label htmlFor="checkbox">I hereby consent that I own the rights to the uploaded content and am aware of the content violation policy.</label>
        </div>}
          <LoadingSpinnerButton disabled={(!consent && visibility === 'public') || (visibility === 'public' && !space.topic.complete)} onClick={onChangeVisibility}>SAVE</LoadingSpinnerButton>

      </div>}
      </>
      : <Loading />
  )
}

export default PublishProject
