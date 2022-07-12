import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useHistory, Link } from 'react-router-dom'
import Matrix from '../../Matrix'
import { MatrixEvent } from 'matrix-js-sdk'
import ISO6391 from 'iso-639-1'

// components
import Collaborators from './Collaborators'
import Category from './Category'
import DisplayContent from './DisplayContent'
import AddContent from './AddContent'
import ProjectImage from './ProjectImage'
import ProjectTitle from './ProjectTitle'
import PublishProject from '../../components/PublishProject'
import ProjectDescription from './ProjectDescription'
import Time from './Time'

import { Loading } from '../../components/loading'
import { useTranslation, Trans } from 'react-i18next'
import Location from './Location'

import config from '../../config.json'
import _ from 'lodash'
import UdKLocationContext from './Context/UdKLocationContext'
import styled from 'styled-components'
import { triggerApiUpdate } from '../../helpers/MedienhausApiHelper'
import TextNavigation from '../../components/medienhausUI/textNavigation'

const TabSection = styled.section`
  display: grid;
  grid-gap: var(--margin);
  grid-template-columns: repeat(auto-fit, minmax(14ch, 1fr));

  /* set height of child elements */
  & > * {
    height: calc(var(--margin) * 2.4);
  }

  /* unset margin-top for each direct child element directly following a previous one */
  & > * + * {
    margin-top: unset;
  }
`

const Create = () => {
  const { t } = useTranslation('content')
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState('')
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks] = useState([])
  const [isCollab, setIsCollab] = useState(false)
  const [contentLang, setContentLang] = useState(config.medienhaus?.languages[0])
  const [spaceObject, setSpaceObject] = useState()
  const [roomMembers, setRoomMembers] = useState()
  const [saveTimestamp, setSaveTimestamp] = useState('')
  const [medienhausMeta, setMedienhausMeta] = useState([])
  const [allocation, setAllocation] = useState([])
  const [locationFromLocationTree, setLocationFromLocationTree] = useState('')
  const [events, setEvents] = useState()
  const [description, setDescription] = useState()
  const [hasContext, setHasContext] = useState(false)
  const [template, setTemplate] = useState(config.medienhaus?.item && Object.keys(config.medienhaus?.item).length > 0 && Object.keys(config.medienhaus?.item)[0])
  const [hideAuthors, setHideAuthors] = useState(false)
  // const [preview, setPreview] = useState(false)
  const history = useHistory()
  const matrixClient = Matrix.getMatrixClient()
  const params = useParams()

  const projectSpace = params.spaceId

  const getCurrentTime = useCallback(() => {
    const today = new Date()
    const month = today.getMonth() + 1 // JS starts month with 0
    const time = today.getHours().toString().padStart(2, '0') + ':' + today.getMinutes().toString().padStart(2, '0') + ':' + today.getSeconds().toString().padStart(2, '0')
    const date = today.getFullYear() + '-' + month.toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0')
    setSaveTimestamp(date + ', ' + time)
  }, [])

  const reloadSpace = async (roomId, eventSpace) => {
    eventSpace && setEvents(eventSpace)
    // roomId is needed in order to invite collaborators to newly created rooms.
    console.log('roomId = ' + roomId)
    // checking to see if the project is a collaboration, if so invite all collaborators and make them admin
    isCollab && roomId && inviteCollaborators(roomId)
    await fetchSpace()
  }

  const inviteCollaborators = async (roomId) => {
    const allCollaborators = Object.keys(roomMembers).filter(userId => userId !== localStorage.getItem('mx_user_id'))
    // const allCollaborators = joinedSpaces?.map((space, i) => space.name === title && Object.keys(space.collab).filter(userId => userId !== localStorage.getItem('mx_user_id') && userId !== process.env.REACT_APP_PROJECT_BOT_ACCOUNT)).filter(space => space !== false)[0]
    // I would be surprised if there isn't an easier way to get joined members...
    const setPower = async (userId) => {
      console.log('changing power level for ' + userId)
      matrixClient.getStateEvent(roomId, 'm.room.power_levels', '').then(async (res) => {
        const powerEvent = new MatrixEvent({
          type: 'm.room.power_levels',
          content: res
        }
        )
        try {
          // something here is going wrong for collab > 2
          await matrixClient.setPowerLevel(roomId, userId, 100, powerEvent)
        } catch (err) {
          console.error(err)
        }
      })
    }
    // invite users to newly created content room
    const invites = allCollaborators?.map(userId => matrixClient.invite(roomId, userId, () => console.log('invited ' + userId)).catch(err => console.log(err)))
    await Promise.all(invites)
    console.log('inviting done, now changing power')
    // then promote them to admin
    const power = allCollaborators.map(userId => setPower(userId))
    await Promise.all(power)
    console.log('all done')
  }

  // const createNewLanguageSpace = async (lang, parent) => {
  //   const opts = (template, name, history) => {
  //     return {
  //       preset: 'private_chat',
  //       name: name,
  //       room_version: '9',
  //       creation_content: { type: 'm.space' },
  //       initial_state: [{
  //         type: 'm.room.history_visibility',
  //         content: { history_visibility: history }
  //       }, //  world_readable
  //       {
  //         type: 'dev.medienhaus.meta',
  //         content: {
  //           version: '0.4',
  //           type: 'item',
  //           template: template,
  //           application: process.env.REACT_APP_APP_NAME,
  //           published: 'draft'
  //         }
  //       },
  //       {
  //         type: 'm.room.guest_access',
  //         state_key: '',
  //         content: { guest_access: 'can_join' }
  //       }],
  //       power_level_content_override: {
  //         ban: 50,
  //         events: {
  //           'm.room.avatar': 50,
  //           'm.room.canonical_alias': 50,
  //           'm.room.encryption': 100,
  //           'm.room.history_visibility': 100,
  //           'm.room.name': 50,
  //           'm.room.power_levels': 100,
  //           'm.room.server_acl': 100,
  //           'm.room.tombstone': 100,
  //           'm.space.child': 50,
  //           'm.room.topic': 50,
  //           'm.room.pinned_events': 50,
  //           'm.reaction': 50,
  //           'im.vector.modular.widgets': 50
  //         },
  //         events_default: 50,
  //         historical: 100,
  //         invite: 50,
  //         kick: 50,
  //         redact: 50,
  //         state_default: 50,
  //         users_default: 0
  //       },
  //       visibility: 'private'
  //     }
  //   }
  //   // create the project space for the student project
  //   const languageRoom = await matrixClient.createRoom(opts('lang', lang, 'shared')).catch(console.log)
  //   await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${parent}/state/m.space.child/${languageRoom.room_id}`, {
  //     method: 'PUT',
  //     headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
  //     body: JSON.stringify({
  //       via: [process.env.REACT_APP_MATRIX_BASE_URL.replace('https://', '')],
  //       suggested: false,
  //       auto_join: false
  //     })
  //   }).catch(console.log)
  //   return languageRoom.room_id
  //   // const events = await matrixClient.createRoom(opts('events', 'events', 'shared'))
  // }

  const fetchSpace = useCallback(async () => {
    if (matrixClient.isInitialSyncComplete()) {
      // here we collect all necessary information about the project
      const space = await matrixClient.getRoomHierarchy(projectSpace)
      setSpaceObject(space)
      const spaceDetails = await matrixClient.getRoom(projectSpace)
      // setting title to project space name
      setTitle(space.rooms[0].name)
      // set the topic depending on selected language
      const desc = {}
      config.medienhaus?.languages.forEach(lang => {
        desc[lang] = space.rooms.filter(room => room.name === lang)[0]?.topic || ''
      })
      setDescription(desc)
      // checking if the project is a collaboration
      setRoomMembers(spaceDetails.currentState.members)
      // fetch custom medienhaus event
      const meta = spaceDetails.currentState.events.get('dev.medienhaus.meta').values().next().value.event.content
      setMedienhausMeta(meta)
      // set type to the contents type
      setTemplate(meta.template)
      // check for allocation event
      const allocationEvent = spaceDetails.currentState.events.get('dev.medienhaus.allocation') ? spaceDetails.currentState.events.get('dev.medienhaus.allocation').values().next().value.event.content : null
      setAllocation(allocationEvent)
      // get the udk meta event
      const udkEventHideAuthors = spaceDetails.currentState.events.get('de.udk-berlin.rundgang') ? spaceDetails.currentState.events.get('de.udk-berlin.rundgang').values().next().value.event.content.hideAuthors : false
      setHideAuthors(udkEventHideAuthors)
      // check if project is published or draft
      setVisibility(meta.published)
      // we fetch the selected language content
      const spaceRooms = space.rooms.filter(room => room.name === contentLang)
      // let getContent
      // if (!spaceRooms[0]) {
      //   // if a language space doesn't exist yet we create it
      //   const languageSpace = await createNewLanguageSpace(contentLang, projectSpace)
      //   console.log(languageSpace)
      //   // eslint-disable-next-line no-debugger
      //   debugger
      //   getContent = await matrixClient.getRoomHierarchy(languageSpace)
      // } else getContent = await matrixClient.getRoomHierarchy(spaceRooms[0].room_id)
      const getContent = await Matrix.roomHierarchy(spaceRooms[0].room_id)
      setBlocks(getContent.filter(room => room.name !== contentLang).filter(room => room.name.charAt(0) !== 'x').sort((a, b) => {
        return a.name.substring(0, a.name.indexOf('_')) - b.name.substring(0, b.name.indexOf('_'))
      }))
      // check if there is an events space
      const checkForEventSpace = space.rooms.filter(room => room.name === 'events')
      const getEvents = checkForEventSpace.length > 0 && await matrixClient.getRoomHierarchy(space.rooms.filter(room => room.name === 'events')[0].room_id, 0).catch(err => console.log(err + '. This means there is no Event space, yet'))
      setEvents(getEvents?.rooms || 'depricated')
      getCurrentTime()
    } else {
      console.log('sync not done, trying again')
      setTimeout(() => fetchSpace(), 250)
    }
  }, [matrixClient, projectSpace, getCurrentTime, contentLang])

  useEffect(() => {
    if (!projectSpace) {
      setTitle('')
      setDescription()
      setEvents()
      setLocationFromLocationTree('')
      setAllocation([])
    }
    projectSpace && fetchSpace()
  }, [projectSpace, fetchSpace, title])

  useEffect(() => {
    if (!projectSpace || !spaceObject) {
      // We do not listen for any room-specific events if we are not currently editing a project
      return
    }
    async function handleRoomTimelineEvent (event) {
      if (event.event.type === 'm.room.message' && blocks?.filter(({ roomId }) => event.event.room_id.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        // If a given content block room received a new message, we set the "lastUpdate" property of the appropriate
        // block in "blocks" which will force the given content block to re-render.
        setBlocks((blocks) => {
          const newBlocks = [...blocks]

          return newBlocks.map((block) => {
            if (block.room_id === event.event.room_id) {
              block.lastUpdate = event.event.origin_server_ts
            }

            return block
          })
        })
      }
    }

    async function handleRoomStateEvent (event) {
      /*
      Not sure if still needed, might only update collaborator list and causes trouble
      if (event.event.type === 'm.room.member' && spaceObject.rooms?.filter(({ roomId }) => event.sender?.roomId.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        fetchSpace()
      } else
      */

      // since our events space contains nested spaces we need to escape them here from being updated too early and therefore causing FetchCms in Location to return an empty array
      if (event.event.content?.name?.includes('location') ||
        event.event.content?.name?.includes('event') ||
        event.event.content?.name?.includes('bbb') ||
        event.event.content?.name?.includes('livestream') ||
        event.event.content?.name?.includes('date')) {
        return
      }
      if (event.event.type === 'm.room.name' && blocks?.filter(({ roomId }) => event.sender?.roomId.includes(roomId))) {
        // listen to room order changes or deletions (room names being changed)
        fetchSpace()
      } else if (event.event.type === 'm.space.child' && event.event.room_id === projectSpace && event.event.sender !== localStorage.getItem('mx_user_id')) {
        // new content room being added
        fetchSpace()
        matrixClient.joinRoom(event.event.state_key)
      }/* else if (event.event.state_key === projectSpace) {
        fetchSpace()
      }
      */
    }
    // first we check if the initial sync is complete otherwise we create a loop
    if (matrixClient.isInitialSyncComplete()) {
      console.log('subscribe to all room events')
      matrixClient.addListener('Room.timeline', handleRoomTimelineEvent)
      matrixClient.addListener('RoomState.events', handleRoomStateEvent)
    }

    return () => {
      console.log('unsubscribed from all room events')
      matrixClient.removeListener('Room.timeline', handleRoomTimelineEvent)
      matrixClient.removeListener('RoomState.events', handleRoomStateEvent)
    }
  }, [projectSpace, spaceObject, blocks, fetchSpace, matrixClient])

  const listeningToCollaborators = async () => {
    setIsCollab(true)
    try {
      // joining contentRooms which might have been created since we last opened the project
      await matrixClient.getRoomHierarchy(projectSpace).then(res => {
        res.rooms.map(async contentRooms => contentRooms.room_id !== projectSpace && await matrixClient.joinRoom(contentRooms.room_id).catch(err => console.log(err)))
      })
    } catch (err) {
      console.error(err)
    }
  }

  const changeProjectImage = async () => {
    setLoading(true)
    getCurrentTime()
    if (config.medienhaus.api) await triggerApiUpdate(projectSpace)
    setLoading(false)
  }

  const startListeningToCollab = () => {
    setIsCollab(true)
    console.log('Started spying on collaborators')
    listeningToCollaborators()
  }

  const changeTitle = async (newTitle) => {
    setTitle(newTitle)
    if (config.medienhaus.api) await triggerApiUpdate(projectSpace)
  }

  const onChangeDescription = async (description) => {
    // if the selected content language is english we save the description in the project space topic
    contentLang === config.medienhaus?.languages[0] && await matrixClient.setRoomTopic(spaceObject.rooms[0].room_id, description).catch(console.log)
    // here we set the description for the selected language space
    const contentRoom = spaceObject.rooms.filter(room => room.name === contentLang)
    const changeTopic = await matrixClient.setRoomTopic(contentRoom[0].room_id, description).catch(console.log)
    if (config.medienhaus.api) await triggerApiUpdate(projectSpace)
    fetchSpace()
    // @TODO setSpaceObject(spaceObject => ({...spaceObject, rooms: [...spaceObject.rooms, ]}))
    return changeTopic
  }
  const handleHideAuthors = async (e) => {
    setHideAuthors(hideAuthors => !hideAuthors)
    await matrixClient.sendStateEvent(projectSpace, 'de.udk-berlin.rundgang', { hideAuthors: e.target.checked })
  }

  if (projectSpace && !matrixClient.isInitialSyncComplete()) return <Loading />
  return (
    <>
      <section className="welcome">
        <p>
          {projectSpace
            ? <strong>{t('Edit project/event')}</strong>
            : <strong>{t('Create and upload new project or event')}</strong>}
        </p>

        <p>{t('This is the site for creating and editing a project or event. Please add the context in which the project or event was created, a project name, descriptive text and a thumbnail. You can also add more images, videos, livestreams and BigBlueButton sessions.')}</p>
        <p><Trans t={t} i18nKey="submitInstructions2">If you want to continue at a later point in time, the project/event can be saved as a draft and you can find it in your collection under <Link to="/content">/content</Link>.</Trans></p>
        <p>{t('The Rundgang website will be available in English and German. The project or event name can only be entered in one language and will therefore be used for both pages. Other texts should ideally be entered in both languages, otherwise the text will appear on both pages in only one language.')}</p>
      </section>

      <section className="project-title">
        {(!projectSpace && (config.medienhaus?.item && Object.keys(config.medienhaus?.item).length > 1)) && (
          <section>
            <label htmlFor="template"><h3>{t('Type')}</h3></label>
            <select id="template" name="template" value={template} onChange={e => setTemplate(e.target.value)}>
              {_.map(config.medienhaus?.item, (itemTemplateDetails, itemTemplateName) =>
                <option value={itemTemplateName} key={itemTemplateName}>{itemTemplateDetails.label}</option>
              )}
            </select>
          </section>
        )}
        <br />
        <label htmlFor="title"><h3>{t('Title')}</h3></label>
        <ProjectTitle id="title" name="title" title={title} projectSpace={projectSpace} template={template} callback={changeTitle} />
      </section>

      {projectSpace && (
        <>
          <section className="context">
            <h3>{t('Context')}</h3>
            <Category title={title} projectSpace={projectSpace} onChange={setHasContext} parent={process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID} setLocationFromLocationTree={setLocationFromLocationTree} />
          </section>
          {(!config.medienhaus?.item || !config.medienhaus?.item[template]?.blueprint || config.medienhaus?.item[template]?.blueprint.includes('location')) && (
            <section className="events">
              <h3>{t('Location')}</h3>
              <p>{t('Specify at which location your project will be displayed or your event will take place.')}</p>
              <Location inviteCollaborators={inviteCollaborators} reloadSpace={reloadSpace} projectSpace={projectSpace} events={events} allocation={allocation} matrixClient={matrixClient} setLocationFromLocationTree={setLocationFromLocationTree} locationFromLocationTree={locationFromLocationTree} />
            </section>
          )}
          {(!config.medienhaus?.item || !config.medienhaus?.item[template]?.blueprint || config.medienhaus?.item[template]?.blueprint.includes('udklocation')) && (
            <section>
              <h3>{t('Location')}</h3>
              <p>{t('Specify at which location your project will be displayed or your event will take place.')}</p>
              <UdKLocationContext itemSpaceRoomId={projectSpace} />
            </section>
          )}
          {(!config.medienhaus?.item || !config.medienhaus?.item[template]?.blueprint || config.medienhaus?.item[template]?.blueprint.includes('time')) && (
            <Time reloadSpace={reloadSpace} projectSpace={projectSpace} allocation={allocation} matrixClient={matrixClient} />
          )}
          {(!config.medienhaus?.item || !config.medienhaus?.item[template]?.blueprint || config.medienhaus?.item[template]?.blueprint.includes('contributors')) && (
            <section className="contributors">
              <Collaborators projectSpace={spaceObject?.rooms} members={roomMembers} time={getCurrentTime} startListeningToCollab={() => startListeningToCollab()} />
            </section>
          )}

          {(!config.medienhaus?.item || !config.medienhaus?.item[template]?.blueprint || config.medienhaus?.item[template]?.blueprint.includes('image')) && (
            <section className="project-image">
              <h3>{t('Project image')}</h3>
              {loading ? <Loading /> : <ProjectImage projectSpace={projectSpace} changeProjectImage={changeProjectImage} />}
            </section>
          )}
          <section className="content">
            <h3>{t('Content')}</h3>
            <p><Trans t={t} i18nKey="contentInstructions1">You can add elements like texts, images, audio and video files, BigBlueButton sessions and livestreams by typing <code>/</code> at the beginning of a new paragraph.</Trans></p>
            <p><Trans t={t} i18nKey="contentInstructions2">The first block&thinsp;&mdash;&thinsp;which is the introduction to your project&thinsp;&mdash;&thinsp;is required.</Trans></p>
            <p><Trans t={t} i18nKey="contentInstructions3">You can format your input by highlighting the text to be formatted with your cursor.</Trans></p>
            <p><Trans t={t} i18nKey="contentInstructions4">Content can be provided in multiple languages. We would recommend to provide the content in both, English and German. If you provide contents for just one language that content will appear on both Rundgang website versions, the English and the German one.</Trans></p>
            {/*
            <select
              value={contentLang} onChange={(e) => {
                setContentLang(e.target.value)
                setDescription()
              }}
            >
              {config.medienhaus?.languages.map((lang) => (
                <option value={lang} key={lang}>{lang.toUpperCase() + ' -- ' + ISO6391.getName(lang)}</option>
              ))}
            </select>
            */}
            <TabSection className="request">
              {config.medienhaus?.languages.map((lang) => (
                <TextNavigation
                  value={lang}
                  key={lang}
                  onClick={(e) => {
                    setContentLang(e.target.value)
                    setDescription()
                  }}
                  disabled={lang === contentLang}
                >{ISO6391.getName(lang)}</TextNavigation>
              ))}
            </TabSection>
            {spaceObject && (description || description === '') ? <ProjectDescription description={description[contentLang]} callback={onChangeDescription} /> : <Loading />}
            {blocks.length === 0
              ? <AddContent number={0} projectSpace={spaceObject?.rooms.filter(room => room.name === contentLang)[0]?.room_id} blocks={blocks} contentType={template} reloadSpace={reloadSpace} />
              : blocks.map((content, i) =>
                <DisplayContent
                  block={content}
                  index={i}
                  blocks={blocks}
                  projectSpace={spaceObject?.rooms.filter(room => room.name === contentLang)[0]?.room_id}
                  reloadSpace={reloadSpace}
                  time={getCurrentTime}
                  key={content + i + content?.lastUpdate}
                  contentType={template}
                />
              )}
          </section>
          {/* Placeholder to show preview next to editing
          {blocks.map((content, i) => <DisplayPreview content={content} key={i} matrixClient={matrixClient} />)}
           */}
          <section className="authorship">
            <h3>{t('Authorship / Credits')}</h3>
            <p>{t('If you select this option, it is hidden in the frontend that you have posted the content.')}</p>
            <AuthorCheckbox>
              <label htmlFor="hide-authors">{t('Hide author(s)')}</label>
              <input id="checkbox" name="checkbox" type="checkbox" checked={hideAuthors} onChange={handleHideAuthors} />
            </AuthorCheckbox>
          </section>
          <section className="visibility">
            <h3>{t('Visibility')}</h3>
            <p>{t('Would you like to save your project as a draft or release it for publishing on the Rundgang platform? The released projects will be published in the run-up to the Rundgang on July 18, 2022.')}</p>
            <p>{t('If you still want to make changes to your contributions after publishing, you can continue to do so.')}</p>
            {spaceObject
              ? (<>
                <PublishProject space={spaceObject.rooms[0]} metaEvent={medienhausMeta} hasContext={hasContext} description={(description && description[config.medienhaus?.languages[0]])} published={visibility} time={getCurrentTime} />
                {!(description && description[config.medienhaus?.languages[0]]) && <p>❗️ {t('Please add a short description.')}</p>}
                {!hasContext && <p>❗️ {t('Please select a context.')}</p>}
              </>)
              : <Loading />}
          </section>

          <section className="preview">
            <div className="confirmation">
              <button className="cancel" onClick={() => history.push('/content')}>← {t('BACK TO OVERVIEW')}</button>
              <button className="confirm" disabled={visibility === 'draft' && true} onClick={() => window.open(`https://2022.rundgang.udk-berlin.de/${contentLang === 'en' ? 'en/' : ''}c/${params.spaceId}`, '_blank')}>{t('Preview')}*</button>
            </div>
            {saveTimestamp && <p className="timestamp">↳ {t('Last saved at')} {saveTimestamp}</p>}
            <p>
              * <em>{t('Preview is only possible if the project/event is public. Please note that the Rundgang platform 2022 is currently still being edited and may still contain minor errors. The final Rundgang platform will be available on 18.07.2022 via:')} https://rundgang.udk-berlin.de/</em>
            </p>
          </section>
        </>
      )}
    </>
  )
}

export default Create
