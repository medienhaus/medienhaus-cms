import React, { useEffect, useState } from 'react'
import { useBlockProps, BlockPreview } from '@wordpress/block-editor'
import { View } from '@wordpress/primitives'

import i18n from 'i18next'
import { fetchContentsForGutenberg } from '../../create/utils/gutenbergUtils'
import Matrix from '../../../Matrix'
// import { BlockPreview } from '@wordpress/block-editor/build/components/block-preview'

const t = i18n.getFixedT(null, 'gutenberg')

function AddCitation ({ callback }) {
  const [roomId, setRoomId] = useState('')
  const [newRoomId, setNewRoomId] = useState('')
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    console.log(roomId)
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
    console.log(e.target.value)
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    if (content) return <View {...blockProps}> <BlockPreview blocks={content} /> </View>

    const onSubmit = (content) => {
      console.log(content)
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
