import Matrix from '../../Matrix'

export const addLanguage = async (matrixClient, inviteCollaborators, projectSpace, languages, newLang, setNewLang, setLanguages, setAddingAdditionalLanguage) => {
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
