import Matrix from '../../../Matrix'
import config from '../../../config.json'
import { triggerApiUpdate } from '../../../helpers/MedienhausApiHelper'

export const languageUtils = async (matrixClient, inviteCollaborators, projectSpace, languages, newLang, setNewLang, setLanguages, setAddingAdditionalLanguage) => {
  const createLanguageSpace = async (lang) => {
    const opts = (template, name, history) => {
      return {
        preset: 'private_chat',
        name: name,
        room_version: '9',
        creation_content: { type: 'm.space' },
        initial_state: [
          {
            type: 'm.room.history_visibility',
            content: { history_visibility: history }
          }, //  world_readable
          {
            type: 'dev.medienhaus.meta',
            content: {
              version: '0.4',
              type: 'item',
              template: template,
              application: process.env.REACT_APP_APP_NAME,
              published: 'draft'
            }
          },
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: { guest_access: 'can_join' }
          }
        ],
        power_level_content_override: {
          ban: 50,
          events: {
            'm.room.avatar': 50,
            'm.room.canonical_alias': 50,
            'm.room.encryption': 100,
            'm.room.history_visibility': 100,
            'm.room.name': 50,
            'm.room.power_levels': 100,
            'm.room.server_acl': 100,
            'm.room.tombstone': 100,
            'm.space.child': 50,
            'm.room.topic': 50,
            'm.room.pinned_events': 50,
            'm.reaction': 50,
            'im.vector.modular.widgets': 50
          },
          events_default: 50,
          historical: 100,
          invite: 50,
          kick: 50,
          redact: 50,
          state_default: 50,
          users_default: 0
        },
        visibility: 'private'
      }
    }
    const languageRoom = await matrixClient.createRoom(
      opts('lang', lang, 'shared')
    )
    await inviteCollaborators(languageRoom.room_id)
    await Matrix.addSpaceChild(projectSpace, languageRoom.room_id)
  }

  if (languages.includes(newLang)) {
    console.log('error')
    setNewLang('')
    return
  }

  setLanguages([...languages, newLang])
  setAddingAdditionalLanguage(false)
  console.log(projectSpace)
  await createLanguageSpace(newLang)
}

export const fetchLanguages = async (id) => {
  const spaces = await Matrix.roomHierarchy(id, 1000, 1)
  // we filter out all of the spaces which are not the parent space itstelf as well as assuming that if it is an two letter space it is a language space based on the ISO639-1 standard
  // @TODO this is a very hacky way to determine if a space is a language space, it should be discussed if we should check that with additional calls to check the dev.medienhaus.meta event
  return spaces
    ?.filter((room) => room.room_id !== id && room.name.length === 2)
    .map((room) => room.name)
}

export const onChangeDescription = async (description, contentLang, matrixClient, spaceObject, fetchSpace, projectSpace) => {
  // if the selected content language is english we save the description in the project space topic
  contentLang === config.medienhaus?.languages[0] &&
  (await matrixClient
    .setRoomTopic(spaceObject.rooms[0].room_id, description)
    .catch(console.log))
  // here we set the description for the selected language space
  const contentRoom = spaceObject.rooms.filter(
    (room) => room.name === contentLang
  )
  const changeTopic = await matrixClient
    .setRoomTopic(contentRoom[0].room_id, description)
    .catch(console.log)
  fetchSpace(true)
  if (config.medienhaus.api) await triggerApiUpdate(projectSpace)
  // @TODO setSpaceObject(spaceObject => ({...spaceObject, rooms: [...spaceObject.rooms, ]}))
  return changeTopic
}
