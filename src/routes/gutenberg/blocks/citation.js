import React, { useEffect, useState } from 'react'
import { useBlockProps } from '@wordpress/block-editor'
import { View } from '@wordpress/primitives'

import i18n from 'i18next'
import { fetchContentsForGutenberg } from '../../create/utils/gutenbergUtils'
import Matrix from '../../../Matrix'
import heading from './heading'

const t = i18n.getFixedT(null, 'gutenberg')
const renderPreviewBlock = (block) => {
  console.log(block)
  try {
    switch (block.name) {
      case 'medienhaus/paragraph':
        return <p key={block.clientId}>{block.attributes.content}</p>
      case 'medienhaus/heading':
        return heading.preview({ content: block.attributes.content })
      case 'medienhaus/image':
        return <img key={block.clientId} src={block.attributes.url} alt={block.attributes.alt || ''} />
        // Add more cases for other block types as needed
      default:
        return <div key={block.clientId}>Unsupported block type: {block.name}</div>
    }
  } catch (error) {
    console.error('Error rendering block:', error)
    return <div key={block.clientId}>Error rendering block: {block.name}</div>
  }
}
function AddCitation ({ callback }) {
  const [roomId, setRoomId] = useState('')
  const [newRoomId, setNewRoomId] = useState('')
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    const getContent = async () => {
      const blocks = await matrixClient.getRoomHierarchy(roomId)
      fetchContentsForGutenberg(blocks.rooms, matrixClient, callback)
        .catch(console.log)
    }

    if (roomId) {
      getContent()
    }
  }, [roomId])

  const handleFormSubmission = async (e) => {
    e.preventDefault()
    setRoomId(newRoomId)
  }

  return (
    <form onSubmit={handleFormSubmission}>
      <input value={newRoomId} onChange={(e) => setNewRoomId(e.target.value)} />
      <button type="submit">{t('Submit')}</button>
    </form>
  )
}

const citation = {
  apiVersion: 2,
  name: 'medienhaus/citation',
  title: 'Citation',
  category: 'text',
  description: 'Cite content from another matrix room.',
  keywords: ['citation'],
  textdomain: 'default',
  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0H24V24H0z" /><path d="M13 20h-2v-7H4v7H2V4h2v7h7V4h2v16zm8-12v12h-2v-9.796l-2 .536V8.67L19.5 8H21z" fill="var(--color-fg)" /></svg>,
  attributes: {
    content: {
      type: 'string'
    }
  },
  edit: (props) => {
    const {
      attributes: { content },
      setAttributes
    } = props

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()

    if (content) {
      try {
        return (
          <View {...blockProps}>
            {Array.isArray(content)
              ? content.map((block) => renderPreviewBlock(block))
              : <div>Invalid content format</div>}
          </View>
        )
      } catch (error) {
        console.error('Error rendering citation content:', error)
        return <View {...blockProps}>Error rendering citation content</View>
      }
    }

    const onSubmit = (content) => {
      setAttributes({ content })
    }

    return (
      <View {...blockProps}>
        <AddCitation callback={onSubmit} />
      </View>
    )
  }
}
export default citation
