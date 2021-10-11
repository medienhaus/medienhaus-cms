import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import ContextDropdown from '../../../components/ContextDropdown'

const Category = ({ title, projectSpace }) => {
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

  async function onContextChosen (contextSpaceId) {
    let projectSpaceMetaEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')

    setLoading(true)

    if (projectSpaceMetaEvent.context && projectSpaceMetaEvent.context !== contextSpaceId) {
      // If this project was in a different context previously we should try to take it out of the old context
      const req = {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
        body: JSON.stringify({})
      }
      await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpaceMetaEvent.context}/state/m.space.child/${projectSpace}`, req)
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

    // Get the freshly updated state event and save it in our state
    projectSpaceMetaEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')
    setCurrentContext(projectSpaceMetaEvent.context)
    setLoading(false)
  }

  return (
    <>
      {/* }
      <p>{t('In which context do you want to publish your project?')}</p>
      <p>{t('This information is necessary to show your project in the right place on the Rundgang 2021 website, and must therefore be specified when you change the visibility of the project to public.')}</p>
      <p>{t('The context can be a class, a course, a seminar or a free project. If you are unsure, ask the professor of your class or the seminar leader.')}</p>
      <p>{t('You can scroll through the list, or filter/search the list by typing one or more keywords.')}</p>
  */}
      <div style={{ position: 'relative' }}>
        {loading
          ? <Loading />
          : <ContextDropdown onItemChosen={onContextChosen} selectedContext={currentContext} showRequestButton />}
      </div>
      {/* {subject !== '' && !member && <Knock room={room} callback={callback} />} */}
    </>
  )
}
export default Category
