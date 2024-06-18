import _ from 'lodash'
import createBlock from './matrix_create_room'
import * as Showdown from 'showdown'
import Matrix from '../../Matrix'

const matrixClient = Matrix.getMatrixClient()
const ShowdownConverter = new Showdown.Converter()
const nl2br = function (str) {
  return str.split('\n').join('<br>')
}
export const saveGutenbergEditorToMatrix = async (isSavingGutenbergContents,
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
  setGutenbergIdToMatrixRoomId) => {
  if (isSavingGutenbergContents) return

  setIsSavingGutenbergContents(true)

  const orderOfRooms = []
  let gutenbergBlocks = [...temporaryGutenbergContents]

  // filter out all empty gutenberg blocks -- we want to ignore those
  gutenbergBlocks = gutenbergBlocks.filter((block) => {
    return !(
      block.name === 'core/paragraph' &&
            _.get(block, 'attributes.content', '') === ''
    )
  })

  for (const block of blocksRef.current) {
    let deletedARoom = false
    if (!_.find(gutenbergBlocks, { clientId: block.room_id })) {
      await deleteRoom(
        block.room_id,
        spaceObjectRef.current?.rooms.filter(
          (room) => room.name === contentLangRef.current
        )[0].room_id
      )
      deletedARoom = true
    }
    if (deletedARoom) fetchContentBlocks()
  }

  for (const [index, block] of gutenbergBlocks.entries()) {
    let roomId = block.clientId
    let contentType
    switch (block.name) {
      case 'core/list':
        contentType = block.attributes.ordered ? 'ol' : 'ul'
        break
      case 'core/code':
        contentType = 'code'
        break
      case 'medienhaus/heading':
      case 'medienhaus/image':
      case 'medienhaus/audio':
      case 'medienhaus/file':
      case 'medienhaus/video':
      case 'medienhaus/playlist':
      case 'medienhaus/livestream':
        contentType = block.name.replace('medienhaus/', '')
        break
      case 'medienhaus/bigbluebutton':
        contentType = 'bbb'
        break
      default:
        contentType = 'text'
    }

    if (!matrixClient.getRoom(roomId)) {
      // this is a newly created block
      if (!gutenbergIdToMatrixRoomIdRef.current[block.clientId]) {
        const createdBlock = await createBlock(
          null,
          contentType,
          index,
          spaceObjectRef.current?.rooms.filter(
            (room) => room.name === contentLangRef.current
          )[0].room_id
        )
        addToMap(block.clientId, createdBlock, setGutenbergIdToMatrixRoomId)
        // if the item is a collaboration we need to invite all collaborators to the newly created block
        if (isCollab) await inviteCollaborators(createdBlock)
      }

      roomId = gutenbergIdToMatrixRoomIdRef.current[block.clientId]
    }

    // ensure room name is correct
    if (
      _.get(_.find(blocksRef.current, { room_id: roomId }), 'name') !==
            `${index}_${contentType}`
    ) {
      await matrixClient.setRoomName(roomId, `${index}_${contentType}`)
    }
    orderOfRooms.push(roomId)

    // lastly, if the content of this block has not changed, skip this block, otherwise ...
    if (
      _.isEqual(
        block.attributes,
        _.get(_.find(gutenbergContent, { clientId: roomId }), 'attributes')
      ) &&
            _.isEqual(
              block.name,
              _.get(_.find(gutenbergContent, { clientId: roomId }), 'name')
            )
    ) {
      continue
    }

    // ... write new contents to room
    switch (block.name) {
      case 'core/list':
        await matrixClient.sendMessage(roomId, {
          // body: (block.attributes.ordered ? '<ol>' : '<ul>') + block.attributes.values + (block.attributes.ordered ? '</ol>' : '</ul>'), // body should have unformated list (markdowm)
          body: block.attributes.values
            .replaceAll('<li>', '- ')
            .replaceAll('</li>', '\n'), // @TODO add case for ol
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body:
                        (block.attributes.ordered ? '<ol>' : '<ul>') +
                        block.attributes.values +
                        (block.attributes.ordered ? '</ol>' : '</ul>')
        })
        break
      case 'core/code':
        await matrixClient.sendMessage(roomId, {
          body: block.attributes.content,
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: `<pre><code>${block.attributes.content}</code></pre>`
        })
        break
      case 'medienhaus/heading':
        await matrixClient.sendMessage(roomId, {
          body: '### ' + block.attributes.content,
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: `<h3>${block.attributes.content}</h3>`
        })
        break
      case 'medienhaus/image':
        // If this image was uploaded to Matrix already, we don't do anything
        if (block.attributes.url) break
        // If the user has not provided an image and the file input was left "empty", we don't do anything either
        if (!block.attributes.file) break
        // eslint-disable-next-line no-case-declarations,prefer-const
        let uploadedImage = await matrixClient.uploadContent(
          block.attributes.file,
          { name: block.attributes.file.name }
        )
        await matrixClient.sendImageMessage(
          roomId,
          null,
          uploadedImage?.content_uri,
          {
            mimetype: block.attributes.file.type,
            size: block.attributes.file.size,
            name: block.attributes.file.name,
            author: block.attributes.author,
            license: block.attributes.license,
            alt: block.attributes.alttext
          },
          block.attributes.alttext,
          // Beware: We need to provide an empty callback because otherwise matrix-js-sdk fails
          // See https://github.com/medienhaus/medienhaus-cms/issues/173
          () => {
          }
        )
        break
      case 'medienhaus/audio':
        // If this audio was uploaded to Matrix already, we don't do anything
        if (block.attributes.url) break
        // eslint-disable-next-line no-case-declarations,prefer-const
        let uploadedAudio = await matrixClient.uploadContent(
          block.attributes.file,
          { name: block.attributes.file.name }
        )
        await matrixClient.sendMessage(roomId, {
          body: block.attributes.file.name,
          info: {
            size: block.attributes.file.size,
            mimetype: block.attributes.file.type,
            name: block.attributes.file.name,
            author: block.attributes.author,
            license: block.attributes.license,
            alt: block.attributes.alttext
          },
          msgtype: 'm.audio',
          url: uploadedAudio?.content_uri
        })
        break
      case 'medienhaus/file':
        // If this file was uploaded to Matrix already, we don't do anything
        if (block.attributes.url) break
        // eslint-disable-next-line no-case-declarations,prefer-const
        let uploadedFile = await matrixClient.uploadContent(
          block.attributes.file,
          { name: block.attributes.file.name }
        )
        await matrixClient.sendMessage(roomId, {
          body: block.attributes.file.name,
          info: {
            size: block.attributes.file.size,
            mimetype: block.attributes.file.type,
            name: block.attributes.file.name,
            author: block.attributes.author,
            license: block.attributes.license,
            alt: block.attributes.alttext
          },
          msgtype: 'm.file',
          url: uploadedFile?.content_uri
        })
        break
      default:
        await matrixClient.sendMessage(roomId, {
          body: ShowdownConverter.makeMarkdown(block.attributes.content)
            .replaceAll('<br>', '')
            .replaceAll('<br />', ''),
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          formatted_body: block.attributes.content
        })
    }
  }

  // ensure correct order
  await matrixClient.sendStateEvent(
    spaceObjectRef.current?.rooms.filter(
      (room) => room.name === contentLangRef.current
    )[0].room_id,
    'dev.medienhaus.order',
    { order: orderOfRooms }
  )

  // update our "last saved  timestamp"
  setSaveTimestampToCurrentTime()

  await fetchContentBlocks()

  setTemporaryGutenbergContents(undefined)

  setIsSavingGutenbergContents(false)
}

export const fetchContentsForGutenberg = async (blocks, matrixClient, setGutenbergContent) => {
  const contents = []
  for (const block of blocks) {
    const fetchMessage = await matrixClient.http.authedRequest(
      'GET',
        `/rooms/${block.room_id}/messages`,
        {
          limit: 1,
          dir: 'b',
          filter: JSON.stringify({ types: ['m.room.message'] })
        }
    )
    const message = _.isEmpty(fetchMessage.chunk)
      ? null
      : fetchMessage.chunk[0].content

    if (message) {
      const blockType = block.name.slice(block.name.search('_'))
      let n, a

      switch (blockType) {
        case '_heading':
          n = 'medienhaus/heading'
          a = { content: message.body.substr(4) }
          break
        case '_text':
          n = 'core/paragraph'
          a = {
            content: message.formatted_body
              ? message.formatted_body.replace(/<p>(.*)<\/p>/g, '$1<br>')
              : nl2br(message.body)
          }
          break
        case '_code':
          n = 'core/code'
          a = { content: _.escape(message.body) }
          break
        case '_ul':
          n = 'core/list'
          a = {
            ordered: false,
            values: message.formatted_body.slice(4, -5),
            placeholder: 'add list element'
          }
          break
        case '_ol':
          n = 'core/list'
          a = {
            ordered: true,
            values: message.formatted_body.slice(4, -5),
            placeholder: 'add list element'
          }
          break
        case '_quote':
          n = 'medienhaus/quote'
          a = { content: message.body }
          break
        case '_image':
          n = 'medienhaus/image'
          a = {
            url: matrixClient.mxcUrlToHttp(message.url),
            alt: message.info.alt,
            license: message.info.license,
            author: message.info.author
          }
          break
        case '_audio':
          n = 'medienhaus/audio'
          a = {
            url: matrixClient.mxcUrlToHttp(message.url),
            alt: message.info.alt,
            license: message.info.license,
            author: message.info.author
          }
          break
        case '_file':
          n = 'medienhaus/file'
          a = {
            url: matrixClient.mxcUrlToHttp(message.url),
            alt: message.info.alt,
            license: message.info.license,
            author: message.info.author,
            name: message.info.name
          }
          break
        case '_video':
          n = 'medienhaus/video'
          a = {
            content: message.body
          }
          break
        case '_bbb':
          n = 'medienhaus/bigbluebutton'
          a = {
            content: message.body
          }
          break
        case '_playlist':
          n = 'medienhaus/playlist'
          a = {
            content: message.body
          }
          break
        default:
          n = 'core/paragraph'
          a = { content: message.formatted_body }
      }
      contents.push({
        clientId: block.room_id,
        isValid: true,
        name: n,
        attributes: a,
        innerBlocks: []
      })
    }
  }
  setGutenbergContent(contents)
}

export const warnUserAboutUnsavedChanges = (e, temporaryGutenbergContents) => {
  // @TODO this only works on reloads, changing the route via the navigation doesn't trigger this
  if (temporaryGutenbergContents) {
    e.returnValue = 'Please save your changes'
    return e.returnValue
  }
}
export const addToMap = (blockId, roomId, setGutenbergIdToMatrixRoomId) => {
  setGutenbergIdToMatrixRoomId((prevState) => ({
    ...prevState,
    [blockId]: roomId
  }))
}
