import React, { useEffect } from 'react'
import {
  BlockEditorProvider,
  BlockList,
  BlockTools,
  WritingFlow,
  ObserveTyping, RichTextToolbarButton
} from '@wordpress/block-editor'
import { SlotFillProvider, Popover } from '@wordpress/components'
import { useState } from '@wordpress/element'

import * as paragraph from '@wordpress/block-library/build/paragraph'
import * as list from '@wordpress/block-library/build/list'
import * as code from '@wordpress/block-library/build/code'
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts'

import { registerBlockType, unregisterBlockType } from '@wordpress/blocks'
import { registerFormatType, toggleFormat, unregisterFormatType } from '@wordpress/rich-text'
import { bold } from '@wordpress/format-library/build/bold'
import { italic } from '@wordpress/format-library/build/italic'
import { registerCoreBlocks } from '@wordpress/block-library'
import { useTranslation } from 'react-i18next'
import video from './blocks/video'
import playlist from './blocks/playlist'
import livestream from './blocks/livestream'
import heading from './blocks/heading'
import image from './blocks/image'
import audio from './blocks/audio'
import file from './blocks/file'
import link from './blocks/link'

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

function GutenbergEditor ({ content = [], blockTypes = ['text', 'heading', 'list', 'code', 'image', 'audio', 'video', 'file', 'playlist', 'livestream', 'bigbluebutton', 'link'], onChange }) {
  const [blocks, setBlocks] = useState(content)
  const { t } = useTranslation('gutenberg')

  useEffect(() => {
    // register
    registerFormatType('bold', bold)
    registerFormatType('italic', italic)
    registerFormatType('strikethrough', {
      name: 'core/strikethrough',
      title: 'Strikethrough',
      tagName: 'del',
      className: null,
      edit: ({ isActive, value, onChange, onFocus }) => {
        function onClick () {
          onChange(toggleFormat(value, { type: 'core/strikethrough', title: 'Strikethrough' }))
          onFocus()
        }

        return (
          <RichTextToolbarButton
            icon={(
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M9.1 9v-.5c0-.6.2-1.1.7-1.4.5-.3 1.2-.5 2-.5.7 0 1.4.1 2.1.3.7.2 1.4.5 2.1.9l.2-1.9c-.6-.3-1.2-.5-1.9-.7-.8-.1-1.6-.2-2.4-.2-1.5 0-2.7.3-3.6 1-.8.7-1.2 1.5-1.2 2.6V9h2zM20 12H4v1h8.3c.3.1.6.2.8.3.5.2.9.5 1.1.8.3.3.4.7.4 1.2 0 .7-.2 1.1-.8 1.5-.5.3-1.2.5-2.1.5-.8 0-1.6-.1-2.4-.3-.8-.2-1.5-.5-2.2-.8L7 18.1c.5.2 1.2.4 2 .6.8.2 1.6.3 2.4.3 1.7 0 3-.3 3.9-1 .9-.7 1.3-1.6 1.3-2.8 0-.9-.2-1.7-.7-2.2H20v-1z" />
              </svg>
                )}
            title="Strikethrough"
            onClick={onClick}
            isActive={isActive}
          />
        )
      }
    })

    if (blockTypes.includes('text')) registerCoreBlocks([_.set(paragraph, 'metadata.attributes.placeholder.default', t('Type / to choose a block'))])
    if (blockTypes.includes('list')) registerCoreBlocks([list])
    if (blockTypes.includes('code')) registerCoreBlocks([code])

    if (blockTypes.includes('video')) registerBlockType('medienhaus/video', video)
    if (blockTypes.includes('livestream')) registerBlockType('medienhaus/livestream', livestream)
    if (blockTypes.includes('playlist')) registerBlockType('medienhaus/playlist', playlist)
    if (blockTypes.includes('heading')) registerBlockType('medienhaus/heading', heading)
    if (blockTypes.includes('image')) registerBlockType('medienhaus/image', image)
    if (blockTypes.includes('audio')) registerBlockType('medienhaus/audio', audio)
    if (blockTypes.includes('file')) registerBlockType('medienhaus/file', file)
    if (blockTypes.includes('link')) registerBlockType('medienhaus/link', link)

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
      unregisterBlockType('medienhaus/file')
      unregisterBlockType('medienhaus/link')
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
                  <div style={{ padding: '0 1rem 1rem 1rem', display: 'grid', gridGap: '1rem', gridTemplateColumns: '1fr auto 1fr' }}>
                    <hr style={{ borderWidth: '2px', transform: 'translateY(-1px)' }} />
                    <button style={{ width: '2rem', height: '2rem', display: 'grid', placeContent: 'center', justifySelf: 'center' }} onClick={addBlock}>+</button>
                    <hr style={{ borderWidth: '2px', transform: 'translateY(-1px)' }} />
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
