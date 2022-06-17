import React, { useEffect } from 'react'
import {
  BlockEditorProvider,
  BlockList,
  BlockTools,
  WritingFlow,
  ObserveTyping
} from '@wordpress/block-editor'
import { SlotFillProvider, Popover } from '@wordpress/components'
import { useState } from '@wordpress/element'

import * as paragraph from '@wordpress/block-library/build/paragraph'
import * as list from '@wordpress/block-library/build/list'
import * as code from '@wordpress/block-library/build/code'
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts'

import { registerBlockType, unregisterBlockType } from '@wordpress/blocks'
import { registerFormatType, unregisterFormatType } from '@wordpress/rich-text'
import { bold } from '@wordpress/format-library/build/bold'
import { italic } from '@wordpress/format-library/build/italic'
import { strikethrough } from '@wordpress/format-library/build/strikethrough'
import { registerCoreBlocks } from '@wordpress/block-library'
import { useTranslation } from 'react-i18next'
import video from './blocks/video'
import playlist from './blocks/playlist'
import livestream from './blocks/livestream'
import heading from './blocks/heading'
import image from './blocks/image'
import audio from './blocks/audio'
import bigbluebutton from './blocks/bigbluebutton'
import _ from 'lodash'

// registerBlockType('medienhaus/quote', {
//   apiVersion: 2,
//   title: 'mhQuote',
//   description: '',
//   category: 'text',
//   attributes: {
//     content: { type: 'string' }
//   },
//   example: {
//     attributes: {
//       content: 'I think, therefore I am.'
//     }
//   },
//   edit: ({ attributes, setAttributes, onReplace }) => {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const blockProps = useBlockProps()
//     const { content } = attributes
//     return (BlockQuotation, blockProps, (RichText, {
//       identifier: 'value',
//       multiline: true,
//       value: content,
//       onChange: nextValue => setAttributes({
//         value: nextValue
//       }),
//       onRemove: forward => {
//         if (!forward) {
//           onReplace([])
//         }
//       },
//       onReplace,
//       textAlign: 'right'
//     })) /*, (<div className="center" {...blockProps}>
//         {!content && 'Loading'}
//         {content}
//       </div>
//     ) */
//   }
// })

function GutenbergEditor ({ content = [], blockTypes = ['text', 'heading', 'list', 'code', 'image', 'audio', 'video', 'playlist', 'livestream', 'bigbluebutton'], onChange }) {
  const [blocks, setBlocks] = useState(content)
  const { t } = useTranslation('gutenberg')

  useEffect(() => {
    // register
    registerFormatType('bold', bold)
    registerFormatType('italic', italic)
    registerFormatType('strikethrough', strikethrough)

    // registerBlockType(code.metadata, { ...code.settings, transforms: null })
    // registerBlockType(list.metadata, { ...list.settings, transforms: null })
    // registerBlockType(paragraph.metadata, { ...paragraph.settings, transforms: null })

    if (blockTypes.includes('text')) registerCoreBlocks([_.set(paragraph, 'metadata.attributes.placeholder.default', t('Type / to choose a block'))])
    if (blockTypes.includes('list')) registerCoreBlocks([list])
    if (blockTypes.includes('code')) registerCoreBlocks([code])

    if (blockTypes.includes('video')) registerBlockType('medienhaus/video', video)
    if (blockTypes.includes('livestream')) registerBlockType('medienhaus/livestream', livestream)
    if (blockTypes.includes('playlist')) registerBlockType('medienhaus/playlist', playlist)
    if (blockTypes.includes('heading')) registerBlockType('medienhaus/heading', heading)
    if (blockTypes.includes('image')) registerBlockType('medienhaus/image', image)
    if (blockTypes.includes('audio')) registerBlockType('medienhaus/audio', audio)
    if (blockTypes.includes('bigbluebutton')) registerBlockType('medienhaus/bigbluebutton', bigbluebutton)

    return () => {
      // Unregister
      unregisterBlockType('core/paragraph')
      unregisterBlockType('core/code')
      unregisterBlockType('core/list')
      unregisterBlockType('medienhaus/video')
      unregisterBlockType('medienhaus/livestream')
      unregisterBlockType('medienhaus/playlist')
      unregisterBlockType('medienhaus/heading')
      unregisterBlockType('medienhaus/image')
      unregisterBlockType('medienhaus/audio')
      unregisterBlockType('medienhaus/bigbluebutton')
      unregisterFormatType('core/bold')
      unregisterFormatType('core/italic')
      unregisterFormatType('core/strikethrough')
    }
    // We need an empty array below because otherwise we run into performance issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setBlocks(content)
  }, [content])

  const blocksHaveChanged = (blocks) => {
    // If we have a callback, call them
    if (onChange) onChange(blocks)
  }

  const addBlock = (e) => {
    setBlocks(prevState => {
      const newState = [...prevState]
      newState.push({
        clientId: _.random(100990, false),
        name: 'core/paragraph',
        attributes: { content: '' },
        isValid: true,
        innerBlocks: []
      })
      return newState
    })
  }

  return (
    <>
      <BlockEditorProvider
        settings={{
          canLockBlocks: false,
          codeEditingEnabled: false,
          bodyPlaceholder: t('Start typing something...'),
          keepCaretInsideBlock: false
        }}
        value={blocks}
        onInput={(blocks) => {
          setBlocks(blocks)
          blocksHaveChanged(blocks)
        }}
        onChange={(blocks) => {
          setBlocks(blocks)
          blocksHaveChanged(blocks)
        }}
      >
        <ShortcutProvider>
          <SlotFillProvider>
            <BlockTools>
              <WritingFlow>
                <ObserveTyping>
                  <BlockList renderAppender={() => null} />
                  <div style={{ padding: '1rem', textAlign: 'right' }}>
                    <button style={{ width: 'calc(var(--margin) * 2.5)' }} onClick={addBlock}>+</button>
                  </div>
                </ObserveTyping>
              </WritingFlow>
            </BlockTools>
            <Popover.Slot />
          </SlotFillProvider>
        </ShortcutProvider>
      </BlockEditorProvider>
    </>
  )
}

export default GutenbergEditor
