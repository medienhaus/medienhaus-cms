import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import ContextDropdown from '../../../components/ContextDropdown'
import { useTranslation } from 'react-i18next'

const Category = ({ title, projectSpace }) => {
  const { t } = useTranslation('projects')
  // const [subject, setSubject] = useState('')
  // const [room, setRoom] = useState('')
  // const [member, setMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentContext, setCurrentContext] = useState(null)
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    async function getCurrentContext () {
      const projectSpaceMetaEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')
      setCurrentContext(projectSpaceMetaEvent.context)
      setLoading(false)
    }

    getCurrentContext()
  }, [matrixClient, projectSpace])

  // const isMember = async (e) => {
  //   e.preventDefault()
  //   setLoading(true)
  //   setMember(true)
  //   setSubject(e.target.value)
  //   setRoom(JSON.parse(e.target.value))
  //   try {
  //     await matrixClient.members(room.space + localStorage.getItem('mx_home_server')).catch(err => console.error(err)).then(res => {
  //       setMember(res.chunk.map(a => a.sender).includes(localStorage.getItem('mx_user_id')))
  //     })
  //     console.log(member)
  //   } catch (err) {
  //     console.error(err)
  //     setMember(false)
  //   }
  //
  //   setLoading(false)
  // }
  // const callback = (requested) => {
  //   setSubject('')
  // }
  async function removeFromContext (spaceId) {
    const req = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({})
    }
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${spaceId}/state/m.space.child/${projectSpace}`, req)
  }

  async function onContextChosen (contextSpaceId) {
    const projectSpaceMetaEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')

    if (projectSpaceMetaEvent.context && projectSpaceMetaEvent.context !== contextSpaceId) {
      // If this project was in a different context previously we should try to take it out of the old context
      await removeFromContext(projectSpaceMetaEvent.context)
    }

    // Add this current project to the given context space
    const req = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({
        auto_join: false,
        suggested: false,
        via: [process.env.REACT_APP_MATRIX_BASE_URL.replace('https://', '')]
      })
    }
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${contextSpaceId}/state/m.space.child/${projectSpace}`, req)

    // Set the new context in our meta event
    projectSpaceMetaEvent.context = contextSpaceId
    await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.meta', projectSpaceMetaEvent)
  }
  const FreeContext = () => {
    const [addToFreeContext, setAddToFreeContext] = useState(false)

    useEffect(() => {
      if (addToFreeContext) {
        onContextChosen('!AdCHWsaxBxaGLzDabX:dev.medienhaus.udk-berlin.de')
      } else {
        removeFromContext('!AdCHWsaxBxaGLzDabX:dev.medienhaus.udk-berlin.de')
      }
    }, [addToFreeContext])

    return (

      <div className="checkboxWrapper">
        <label htmlFor="checkbox">{t('Add this project to a free context.')}</label>
        <input id="checkbox" checked={addToFreeContext} name="checkbox" type="checkbox" onChange={() => setAddToFreeContext(addToFreeContext => !addToFreeContext)} />
      </div>

    )
  }

  if (loading) { return <Loading /> }

  return (
    <>
      <p>{t('In which context do you want to publish your project?')}</p>
      <p>{t('This information is necessary to show your project in the right place on the Rundgang 2021 website, and must therefore be specified when you change the visibility of the project to public.')}</p>
      <p>{t('The context can be a class, a course, a seminar or a free project. If you are unsure, ask the professor of your class or the seminar leader.')}</p>
      <p>{t('You can scroll through the list, or filter/search the list by typing one or more keywords.')}</p>
      <div style={{ position: 'relative' }}>
        <ContextDropdown onItemChosen={onContextChosen} selectedContext={currentContext} showRequestButton />
      </div>
      <FreeContext />
      {/* {subject !== '' && !member && <Knock room={room} callback={callback} />} */}
    </>
  )
}
export default Category
