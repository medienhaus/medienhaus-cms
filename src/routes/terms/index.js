import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Loading } from '../../components/loading'
import Matrix from '../../Matrix'
import { makeRequest } from '../../Backend'

import config from '../../config.json'

const Terms = () => {
  const history = useHistory()
  const location = useLocation()
  const { t } = useTranslation('terms')
  const { from } = location.state || { from: { pathname: '/' } }

  const [initialSyncCompleted, setInitialSyncCompleted] = useState(false)

  useEffect(() => {
    function checkForInitialSyncCompleted () {
      if (Matrix.getMatrixClient().isInitialSyncComplete()) {
        setInitialSyncCompleted(true)
      } else {
        setTimeout(checkForInitialSyncCompleted, 250)
      }
    }

    if (!initialSyncCompleted) checkForInitialSyncCompleted()
  }, [initialSyncCompleted])

  // Returns the "terms and conditions" space of this user if they have created one already
  async function getTermsRoomId () {
    const answer = await Matrix.getMatrixClient().getJoinedRooms()
    for (const index in answer.joined_rooms) {
      const roomId = answer.joined_rooms[index]
      const metaEvent = await Matrix.getMatrixClient().getStateEvent(roomId, 'dev.medienhaus.meta').catch(e => console.log(e))
      if (!metaEvent) continue
      const createEvent = await Matrix.getMatrixClient().getStateEvent(roomId, 'm.room.create').catch(e => console.log(e))
      if (!createEvent) continue

      if (metaEvent.type === 'termsAndConditions' && createEvent.creator === Matrix.getMatrixClient().getUserId()) {
        return roomId
      }
    }
  }

  async function createTermsRoom () {
    return await Matrix.getMatrixClient().createRoom({
      preset: 'private_chat',
      name: 'termsAndConditions',
      room_version: '9',
      initial_state: [{
        type: 'dev.medienhaus.meta',
        content: {
          version: '0.3',
          template: 'termsAndConditions'
        }
      }],
      visibility: 'private'
    })
  }

  if (!initialSyncCompleted) return <Loading />

  return (
    <section className="terms">
      <h1>{t('Terms & Conditions')}</h1>
      <p>{t('Before uploading any content, we kindly ask you to read through and accept the following terms & conditions and content violation policies.')}</p>
      <ul>
        {config?.medienhaus?.sites?.terms?.map((term, index) => {
          const lang = localStorage.getItem('cr_lang') ? localStorage.getItem('cr_lang') : (config?.medienhaus?.languages[0] ? config?.medienhaus?.languages[0] : 'en')
          const content = term[lang]
          return (
            <li key={index}>
              {content}
            </li>
          )
        })}

      </ul>
      <button
        name="submit" type="submit" onClick={() => {
          const acceptTerms = async function () {
            let termsRoomId = await getTermsRoomId()
            if (!termsRoomId) {
              termsRoomId = (await createTermsRoom()).room_id
            }

            // Tell the backend that we accept the terms
            await makeRequest('/cms/terms', { termsRoomId })

            history.push(from)
          }

          acceptTerms()
        }}
      >{t('ACCEPT & SAVE')}
      </button>
    </section>
  )
}

export default Terms
