import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateContext from './CreateContext'

const ManageContexts = (props) => {
  const { t } = useTranslation('admin')
  const [newContext, setNewContext] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false)
  const [parent] = useState('!ZbMmIxgnJIhuROlgKJ:dev.medienhaus.udk-berlin.de')

  function onSubmit (e) {
    e.preventDefault()
    const createSpace = async (title) => {
      setLoading(true)
      const opts = (type, name, history) => {
        return {
          preset: 'private_chat',
          name: name,
          room_version: '7',
          creation_content: { type: 'm.space' },
          initial_state: [{
            type: 'm.room.history_visibility',
            content: { history_visibility: history } //  world_readable
          },
          {
            type: 'dev.medienhaus.meta',
            content: {
              version: '0.3',
              rundgang: 21,
              type: type,
              published: 'draft'
            }
          },
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: { guest_access: 'can_join' }
          }],
          visibility: 'private'
        }
      }

      // create the space for the context
      const space = await props.matrixClient.createRoom(opts('context', title, 'world_readable')).catch(console.log)
      // add this subspaces as children to the root space
      await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${parent}/state/m.space.child/${space.room_id}`, {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
        body: JSON.stringify({
          via:
                  [process.env.REACT_APP_MATRIX_BASE_URL],
          suggested: false,
          auto_join: true
        })
      }).catch(console.log)
      console.log('created Context ' + newContext)

      setLoading(false)
      return space
    }
    createSpace(newContext)
  }

  return (
    <>
      <h2>Manage Contexts</h2>
      <p>Crazy circles</p>
      <CreateContext t={t} parent={parent} matrixClient={props.matrixClient} setNewContext={setNewContext} loading={loading} callback={onSubmit} />
    </>
  )
}
export default ManageContexts
