import React, { useEffect, useState } from 'react'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'

const PublishProject = ({ projectSpace, published }) => {
  const [userFeedback, setUserFeedback] = useState()
  const [visibility, setVisibility] = useState(published)

  useEffect(() => {
    setVisibility(published)
  }, [published])
  const onPublish = async () => {
    const req = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ join_rule: visibility === 'public' ? 'public' : 'invite' })
    }
    try {
      await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.room.join_rules/`, req)
        .then(response => {
          console.log(response)
          if (response.ok) {
            setUserFeedback('Changed successfully!')
            setTimeout(() => {
              setUserFeedback()
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
        <div>
            <div>
                <select id="visibility" name="visibility" value={visibility} onChange={(e) => { setVisibility(e.target.value) }} onBlur={(e) => { setVisibility(e.target.value) }}>
                    <option value="invite">Draft</option>
                    <option value="public">Published</option>
                </select>
            </div>
            <div>
                <LoadingSpinnerButton onClick={onPublish}>{visibility === 'public' ? 'Publish' : 'Redact'}</LoadingSpinnerButton>

                {userFeedback && <p>{userFeedback}</p>}
            </div>
        </div>

  )
}

export default PublishProject
