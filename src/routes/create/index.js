import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import Matrix from '../../Matrix'
import { MatrixEvent } from 'matrix-js-sdk'
import ISO6391 from 'iso-639-1'
import * as useStateRef from 'react-usestateref'

// components
import Collaborators from './Collaborators'
import Category from './Category'
import ProjectImage from './ProjectImage'
import ProjectTitle from './ProjectTitle'
import PublishProject from '../../components/PublishProject'
import ProjectDescription from './ProjectDescription'
import Time from './Time'

import { Loading } from '../../components/loading'
import { useTranslation } from 'react-i18next'
import Location from './Location'

import config from '../../config.json'
import _, { debounce } from 'lodash'
import GutenbergEditor from '../gutenberg/editor'
import LoadingSpinnerButton from '../../components/LoadingSpinnerButton'
import UdKLocationContext from './Context/UdKLocationContext'
import styled from 'styled-components'
import { triggerApiUpdate } from '../../helpers/MedienhausApiHelper'
import Tags from './Tags'
import { fetchLanguages, onChangeDescription } from './utils/languageUtils'
import { fetchContentsForGutenberg, saveGutenbergEditorToMatrix, warnUserAboutUnsavedChanges } from './utils/gutenbergUtils'
import LanguageSelection from './LanguageSelection'

const GutenbergWrapper = styled.div`
  position: relative;

  /* add some vertical spacing between block elements */
  [id^="block-"] {
    margin: calc(var(--margin) * 3.5) calc(var(--margin) * 0.75);
  }

  /* make toolbar fixed and bordered on narrow widths */
  .block-editor-block-contextual-toolbar.is-fixed {
    border: 4px solid var(--color-fg);
    margin-bottom: -4px;
    position: sticky;
    top: 4rem;
  }

  /* set color via variable for toolbar separators */
  .block-editor-block-contextual-toolbar.is-fixed,
    .block-editor-block-toolbar,
    .components-toolbar,
  .block-editor-block-contextual-toolbar.is-fixed,
    .block-editor-block-toolbar,
    .components-toolbar-group {
    border-right-color: var(--color-fg);
  }

  /* set color(s) via variable and not-allowed cursor */
  button[disabled],
  input[type="submit"][disabled] {
    background-color: var(--color-lo);
    border-color: var(--color-lo);
    cursor: not-allowed;
    pointer-events: unset !important;
  }

  /* set color via variable, and unset border-radius */
  .block-editor-block-list__insertion-point-indicator {
    background: var(--color-fg);
    border-radius: unset !important;
  }

  /* make that element flex for viewport resize action™ &
   * add outline to button to make it visually pleasing */
  .block-editor-block-list__insertion-point-inserter {
    display: flex;
    outline: 0.5rem solid var(--color-bg);
  }

  /* set color(s) via variable, and unset border-radius */
  .block-editor-inserter__toggle.components-button.has-icon {
    background: var(--color-fg);
    border-radius: unset !important;
    color: var(--color-bg);
    min-width: 24px;
    height: 24px;

    &:hover {
      background: var(--color-fg);
      color: var(--color-bg);
    }
  }
`

const GutenbergSavingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: not-allowed;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99999999999999;
`

const Create = () => {
  const { t } = useTranslation('content')
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState('')
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks, blocksRef] = useStateRef(undefined)
  const [isCollab, setIsCollab] = useState(false)
  const [contentLang, setContentLang, contentLangRef] = useStateRef(
    config.medienhaus?.languages[0]
  )
  const [spaceObject, setSpaceObject, spaceObjectRef] = useStateRef()
  const [roomMembers, setRoomMembers] = useState()
  const [saveTimestamp, setSaveTimestamp] = useState('')
  const [medienhausMeta, setMedienhausMeta] = useState([])
  const [allocation, setAllocation] = useState([])
  const [events, setEvents] = useState()
  const [gutenbergContent, setGutenbergContent] = useState(undefined)
  /* eslint-disable no-unused-vars */
  const [
    gutenbergIdToMatrixRoomId,
    setGutenbergIdToMatrixRoomId,
    gutenbergIdToMatrixRoomIdRef
  ] = useStateRef({})
  /* eslint-disable no-unused-vars */
  const [description, setDescription] = useState()
  const [hasContext, setHasContext] = useState(undefined)
  const [template, setTemplate] = useState(
    config.medienhaus?.item &&
      Object.keys(config.medienhaus?.item).length > 0 &&
      Object.keys(config.medienhaus?.item)[0]
  )
  // const [preview, setPreview] = useState(false)
  const history = useHistory()
  const matrixClient = Matrix.getMatrixClient()
  const params = useParams()
  const [isSavingGutenbergContents, setIsSavingGutenbergContents] =
    useState(false)
  const [temporaryGutenbergContents, setTemporaryGutenbergContents] =
    useState(undefined)

  const [languages, setLanguages] = useState([])
  const [addingAdditionalLanguage, setAddingAdditionalLanguage] =
    useState(false)

  const projectSpace = params.spaceId

  useEffect(() => {
    // we reset the content language to the default language if the project space changes back to the /create route
    if (!projectSpace) {
      console.log('no project space')
      setAddingAdditionalLanguage(false)
      setLanguages([])
    }
  }, [projectSpace])

  // we populate the languages in this effect hook and check if we allow custom languages, then it will fetch the languages from the project space otherwise it will use the default languages from the config
  useEffect(() => {
    const fetchLanguagesAndUpdateState = async () => {
      const languageSpaces = await fetchLanguages(projectSpace)
      setLanguages(languageSpaces)
    }
    if (languages.length === 0) {
      if (projectSpace && config.medienhaus?.customLanguages) {
        fetchLanguagesAndUpdateState(projectSpace)
      } else {
        setLanguages(config.medienhaus?.languages)
      }
    }
  }, [setLanguages, projectSpace, matrixClient, languages.length])

  const setSaveTimestampToCurrentTime = useCallback(() => {
    const today = new Date()
    const month = today.getMonth() + 1 // JS starts month with 0
    const time =
      today.getHours().toString().padStart(2, '0') +
      ':' +
      today.getMinutes().toString().padStart(2, '0') +
      ':' +
      today.getSeconds().toString().padStart(2, '0')
    const date =
      today.getFullYear() +
      '-' +
      month.toString().padStart(2, '0') +
      '-' +
      today.getDate().toString().padStart(2, '0')
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
    const allCollaborators = Object.keys(roomMembers).filter(
      (userId) => userId !== localStorage.getItem('mx_user_id')
    )
    // const allCollaborators = joinedSpaces?.map((space, i) => space.name === title && Object.keys(space.collab).filter(userId => userId !== localStorage.getItem('mx_user_id') && userId !== process.env.REACT_APP_PROJECT_BOT_ACCOUNT)).filter(space => space !== false)[0]
    // I would be surprised if there isn't an easier way to get joined members...
    const setPower = async (userId) => {
      console.debug('changing power level for ' + userId)
      matrixClient
        .getStateEvent(roomId, 'm.room.power_levels', '')
        .then(async (res) => {
          const powerEvent = new MatrixEvent({
            type: 'm.room.power_levels',
            content: res
          })
          try {
            // something here is going wrong for collab > 2
            await matrixClient.setPowerLevel(roomId, userId, 100, powerEvent)
          } catch (err) {
            console.error(err)
          }
        })
    }
    // invite users to newly created content room
    const invites = allCollaborators?.map((userId) =>
      matrixClient
        .invite(roomId, userId, () => console.log('invited ' + userId))
        .catch((err) => console.log(err))
    )
    await Promise.all(invites)
    console.debug('inviting done, now changing power')
    // then promote them to admin
    const power = allCollaborators.map((userId) => setPower(userId))
    await Promise.all(power)
    console.debug('all done')
  }

  const fetchContentBlocks = useCallback(async () => {
    const spaceRooms = spaceObjectRef.current.rooms.filter(
      (room) => room.name === contentLangRef.current
    )
    const getContent = await Matrix.roomHierarchy(spaceRooms[0].room_id)
    setBlocks(
      getContent
        .filter((room) => room.name !== contentLangRef.current)
        .filter((room) => room.name.charAt(0) !== 'x')
        .sort((a, b) => {
          return (
            a.name.substring(0, a.name.indexOf('_')) -
            b.name.substring(0, b.name.indexOf('_'))
          )
        })
    )
  }, [spaceObjectRef, setBlocks, contentLangRef])

  const fetchSpace = useCallback(
    async (ignoreBlocks) => {
      if (matrixClient.isInitialSyncComplete()) {
        // here we collect all necessary information about the project
        const space = await matrixClient.getRoomHierarchy(projectSpace)
        setSpaceObject(space)
        const spaceDetails = await matrixClient.getRoom(projectSpace)
        // check if new rooms have been created by collaborators and join them if we are not yet part of them
        if (spaceDetails.currentState.getJoinedMemberCount() > 1) {
          space.rooms.map(async (contentRooms) => {
            if (contentRooms.room_id !== projectSpace) {
              const room = matrixClient.getRoom(contentRooms.room_id)
              if (!room || room.getMyMembership() !== 'join') {
                // if we aren't already part of the room we try to join it
                await matrixClient
                  .joinRoom(contentRooms.room_id)
                  .catch((err) => console.log(err))
              }
            }
          }
          )
        }

        // setting title to project space name
        setTitle(space.rooms[0].name)
        // set the topic depending on selected language
        const desc = {}
        languages.forEach((lang) => {
          desc[lang] =
            space.rooms.filter((room) => room.name === lang)[0]?.topic || ''
        })
        setDescription(desc)
        // checking if the project is a collaboration
        setRoomMembers(spaceDetails.currentState.members)
        // fetch custom medienhaus event
        const meta = spaceDetails.currentState.events
          .get('dev.medienhaus.meta')
          .values()
          .next().value.event.content
        setMedienhausMeta(meta)
        // set type to the contents type
        setTemplate(meta.template)
        // check for allocation event
        const allocationEvent = spaceDetails.currentState.events.get(
          'dev.medienhaus.allocation'
        )
          ? spaceDetails.currentState.events
            .get('dev.medienhaus.allocation')
            .values()
            .next().value.event.content
          : null
        setAllocation(allocationEvent)
        // check if project is published or draft
        setVisibility(meta.published)
        if (!contentLang) return
        // we fetch the selected language content
        if (!ignoreBlocks) fetchContentBlocks()
        // check if there is an events space
        const checkForEventSpace = space.rooms.filter(
          (room) => room.name === 'events'
        )
        const getEvents =
          checkForEventSpace.length > 0 &&
          (await matrixClient
            .getRoomHierarchy(
              space.rooms.filter((room) => room.name === 'events')[0].room_id,
              0
            )
            .catch((err) =>
              console.log(err + '. This means there is no Event space, yet')
            ))
        setEvents(getEvents?.rooms || 'depricated')
        setSaveTimestampToCurrentTime()
      } else {
        console.log('sync not done, trying again')
        setTimeout(() => fetchSpace(), 250)
      }
    },
    [
      matrixClient,
      languages,
      projectSpace,
      setSpaceObject,
      contentLang,
      fetchContentBlocks,
      setSaveTimestampToCurrentTime
    ]
  )

  useEffect(() => {
    if (!projectSpace) {
      setTitle('')
      setDescription()
      setEvents()
    }
    projectSpace && languages?.length > 0 && fetchSpace()
  }, [projectSpace, fetchSpace, title, languages?.length])

  useEffect(() => {
    setGutenbergContent(undefined)
  }, [contentLang])

  useEffect(() => {
    if (!projectSpace || !spaceObject) {
      // We do not listen for any room-specific events if we are not currently editing a project
      return
    }
    async function handleRoomTimelineEvent (event) {
      if (
        event.event.type === 'm.room.message' &&
        blocks?.filter(({ roomId }) => event.event.room_id.includes(roomId)) &&
        event.event.sender !== localStorage.getItem('mx_user_id')
      ) {
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
      if (
        event.event.content?.name?.includes('location') ||
        event.event.content?.name?.includes('event') ||
        event.event.content?.name?.includes('bbb') ||
        event.event.content?.name?.includes('livestream') ||
        event.event.content?.name?.includes('date')
      ) {
        return
      }
      if (
        event.event.type === 'm.room.name' &&
        blocks?.filter(({ roomId }) => event.sender?.roomId.includes(roomId))
      ) {
        // listen to room order changes or deletions (room names being changed)
        fetchSpace()
      } else if (
        event.event.type === 'm.space.child' &&
        event.event.room_id === projectSpace &&
        event.event.sender !== localStorage.getItem('mx_user_id')
      ) {
        // new content room being added
        fetchSpace()
        matrixClient.joinRoom(event.event.state_key)
      } else if (event.event.type === 'dev.medienhaus.meta') {
        fetchSpace()
      }
    }
    // first we check if the initial sync is complete otherwise we create a loop
    if (matrixClient.isInitialSyncComplete()) {
      matrixClient.addListener('Room.timeline', handleRoomTimelineEvent)
      matrixClient.addListener('RoomState.events', handleRoomStateEvent)
    }

    return () => {
      matrixClient.removeListener('Room.timeline', handleRoomTimelineEvent)
      matrixClient.removeListener('RoomState.events', handleRoomStateEvent)
    }
  }, [projectSpace, spaceObject, blocks, fetchSpace, matrixClient, setBlocks])

  const listeningToCollaborators = async () => {
    setIsCollab(true)
    try {
      // joining contentRooms which might have been created since we last opened the project
      await Matrix.roomHierarchy(projectSpace).then((res) => {
        res.map(
          async (contentRooms) =>
            contentRooms.room_id !== projectSpace &&
            (await matrixClient
              .joinRoom(contentRooms.room_id)
              .catch((err) => console.log(err)))
        )
      })
    } catch (err) {
      console.error(err)
    }
  }

  const deleteRoom = async (roomId, parent) => {
    await Matrix.removeSpaceChild(parent, roomId)
    await matrixClient.setRoomName(roomId, 'x_')
    await matrixClient.leave(roomId)
  }

  const contentHasChanged = (originalGutenbergBlocks) => {
    setTemporaryGutenbergContents(originalGutenbergBlocks)
  }

  const changeProjectImage = async () => {
    setLoading(true)
    setSaveTimestampToCurrentTime()
    if (config.medienhaus.api) await triggerApiUpdate(projectSpace)
    setLoading(false)
  }

  const startListeningToCollab = () => {
    setIsCollab(true)
    console.log('Started spying on collaborators')
    // to avoid rate limits we debounce the next function
    debounce(() => listeningToCollaborators(), 100)
  }

  const changeTitle = async (newTitle) => {
    setTitle(newTitle)
    if (config.medienhaus.api) await triggerApiUpdate(projectSpace)
  }

  useEffect(() => {
    window.addEventListener('beforeunload', (e) => warnUserAboutUnsavedChanges(e, temporaryGutenbergContents))

    return () => {
      window.removeEventListener('beforeunload', (e) => warnUserAboutUnsavedChanges(e, temporaryGutenbergContents))
    }
  }, [temporaryGutenbergContents])

  useEffect(() => {
    if (blocks === undefined) return
    fetchContentsForGutenberg(blocks, matrixClient, setGutenbergContent)
  }, [blocks, matrixClient])

  if (projectSpace && !matrixClient.isInitialSyncComplete()) return <Loading />
  return (
    <>
      {/* }
      <section className="welcome">
        <p>
          {projectSpace
            ? <strong>{t('Edit project')}</strong>
            : <strong>{t('Create and upload new project')}</strong>}
        </p>

        <p>{t('This is the project page. Please add the context in which the project was created, a project name, descriptive text and a thumbnail. You can also add more images, videos, livestreams and BigBlueButton sessions.')}</p>
        <p><Trans t={t} i18nKey="submitInstructions2">If you want to continue at a later point in time, the project is automatically saved as a draft and you can find it in your collection under <NavLink to="/content">/content</NavLink>.</Trans></p>
        <p>{t('The Rundgang website will be available in English and German. The project name can only be entered in one language and will therefore be used for both pages. Other texts should ideally be entered in both languages, otherwise the text will appear on both pages in only one language.')}</p>
      </section>
      */}
      {!projectSpace &&
        config.medienhaus?.item &&
        Object.keys(config.medienhaus?.item).length > 1 && (
          <section className="project-type">
            <label htmlFor="template">
              <h3>{t('Type')}</h3>
            </label>
            <select
              id="template"
              name="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {_.map(
                config.medienhaus?.item,
                (itemTemplateDetails, itemTemplateName) => (
                  <option value={itemTemplateName} key={itemTemplateName}>
                    {itemTemplateDetails.label}
                  </option>
                )
              )}
            </select>
          </section>
      )}
      <section className="project-title">
        <label htmlFor="title">
          <h3>{t('Title')}</h3>
        </label>
        <ProjectTitle
          id="title"
          name="title"
          title={title}
          projectSpace={projectSpace}
          template={template}
          callback={changeTitle}
        />
      </section>

      {projectSpace && (
        <>
          <section className="context">
            <h3>{t('Context')}</h3>
            <Category
              title={title}
              projectSpace={projectSpace}
              onChange={setHasContext}
              parent={localStorage.getItem(
                process.env.REACT_APP_APP_NAME + '_root_context_space'
              )}
            />
          </section>
          {(!config.medienhaus?.item ||
            !config.medienhaus?.item[template]?.blueprint ||
            config.medienhaus?.item[template]?.blueprint.includes(
              'location'
            )) && (
              <section className="events">
                <h3>{t('Location')}</h3>
                <Location
                  inviteCollaborators={inviteCollaborators}
                  reloadSpace={reloadSpace}
                  projectSpace={projectSpace}
                  events={events}
                  allocation={allocation}
                  matrixClient={matrixClient}
                />
              </section>
          )}
          {(!config.medienhaus?.item ||
            !config.medienhaus?.item[template]?.blueprint ||
            config.medienhaus?.item[template]?.blueprint.includes(
              'udklocation'
            )) && (
              <section>
                <h3>{t('Location')}</h3>
                <UdKLocationContext spaceRoomId={projectSpace} />
              </section>
          )}
          {(!config.medienhaus?.item ||
            !config.medienhaus?.item[template]?.blueprint ||
            config.medienhaus?.item[template]?.blueprint.includes('time')) && (
              <Time
                reloadSpace={reloadSpace}
                projectSpace={projectSpace}
                allocation={allocation}
                matrixClient={matrixClient}
              />
          )}
          {(!config.medienhaus?.item ||
            !config.medienhaus?.item[template]?.blueprint ||
            config.medienhaus?.item[template]?.blueprint.includes(
              'contributors'
            )) && (
              <section className="contributors">
                <Collaborators
                  projectSpace={spaceObject?.rooms}
                  members={roomMembers}
                  time={setSaveTimestampToCurrentTime}
                  startListeningToCollab={() => startListeningToCollab()}
                />
              </section>
          )}

          {(!config.medienhaus?.item ||
            !config.medienhaus?.item[template]?.blueprint ||
            config.medienhaus?.item[template]?.blueprint.includes('image')) && (
              <section className="project-image">
                <h3>{t('Project image')}</h3>
                {loading
                  ? (
                    <Loading />
                    )
                  : (
                    <ProjectImage
                      projectSpace={projectSpace}
                      changeProjectImage={changeProjectImage}
                    />
                    )}
              </section>
          )}

          {(!config.medienhaus?.item ||
            !config.medienhaus?.item[template]?.blueprint ||
            config.medienhaus?.item[template]?.blueprint.includes('tags')) && (
              <section className="tags">
                <h3>{t('Tags')}</h3>
                <Tags
                  projectSpace={projectSpace}
                  placeholder="tags separated by space character"
                />
              </section>
          )}

          <section className="content">
            <h3>{t('Content')}</h3>
            <LanguageSelection
              setLanguages={setLanguages}
              languages={languages}
              projectSpace={projectSpace}
              setAddingAdditionalLanguage={setAddingAdditionalLanguage}
              addingAdditionalLanguage={addingAdditionalLanguage}
              setContentLang={setContentLang}
              setDescription={setDescription}
              inviteCollaborators={inviteCollaborators}
              contentLang={contentLang}
            />
            {spaceObject && (description || description === '')
              ? (
                <ProjectDescription
                  disabled={addingAdditionalLanguage}
                  description={description[contentLang]}
                  callback={(updatedDescription) => onChangeDescription(updatedDescription, contentLang, matrixClient, spaceObject, fetchSpace, projectSpace)}
                  language={ISO6391.getName(contentLang)}
                />
                )
              : (
                <Loading />
                )}

            <GutenbergWrapper>
              {gutenbergContent === undefined
                ? (
                  <Loading />
                  )
                : (
                  <GutenbergEditor
                    disabled={addingAdditionalLanguage}
                    content={gutenbergContent}
                    blockTypes={_.get(config, [
                      'medienhaus',
                      'item',
                      template,
                      'content'
                    ])}
                    onChange={contentHasChanged}
                  />
                  )}
              {isSavingGutenbergContents && <GutenbergSavingOverlay />}
            </GutenbergWrapper>
            {temporaryGutenbergContents && (
              <LoadingSpinnerButton
                type="button"
                disabled={addingAdditionalLanguage}
                onClick={() =>
                  saveGutenbergEditorToMatrix(isSavingGutenbergContents,
                    setIsSavingGutenbergContents,
                    temporaryGutenbergContents,
                    blocksRef,
                    deleteRoom,
                    spaceObjectRef,
                    contentLangRef,
                    fetchContentBlocks,
                    gutenbergIdToMatrixRoomIdRef,
                    isCollab,
                    inviteCollaborators,
                    gutenbergContent,
                    setSaveTimestampToCurrentTime,
                    setTemporaryGutenbergContents,
                    setGutenbergIdToMatrixRoomId)}
              >
                {t('SAVE CHANGES')}
              </LoadingSpinnerButton>
            )}
          </section>
          {/* Placeholder to show preview next to editing
          {blocks.map((content, i) => <DisplayPreview content={content} key={i} matrixClient={matrixClient} />)}
           */}
          <section className="visibility">
            <h3>{t('Visibility')}</h3>
            {/* <p>{t('Would you like to save your project as a draft or release it for publishing on the Rundgang platform? The released projects will be published in the run-up to the Rundgang on October 25, 2021.')}</p> */}
            {/* <p>{t('If you still want to make changes to your contributions after publishing, you can continue to do so.')}</p> */}
            {spaceObject && hasContext !== undefined
              ? (
                <>
                  <PublishProject
                    space={spaceObject.rooms[0]}
                    metaEvent={medienhausMeta}
                    hasContext={hasContext}
                    description={
                    description && description[config.medienhaus?.languages[0]]
                  }
                    published={visibility}
                    time={setSaveTimestampToCurrentTime}
                  />
                  {!(
                    description && description[config.medienhaus?.languages[0]]
                  ) && (
                    <p>
                      ❗️{' '}
                      {t('Please add a short description in') +
                      ' ' +
                      ISO6391.getName(languages[0])}
                    </p>
                  )}
                  {!hasContext && <p>❗️ {t('Please select a context.')}</p>}
                </>
                )
              : (
                <Loading />
                )}
          </section>

          <section className="save">
            <div className="confirmation">
              <button
                className="cancel"
                onClick={() => history.push('/content')}
              >
                ← {t('BACK TO OVERVIEW')}
              </button>
            </div>
            {saveTimestamp && (
              <p className="timestamp">
                ↳ {t('Last saved at')} {saveTimestamp}
              </p>
            )}
          </section>
        </>
      )}
    </>
  )
}

export default Create
