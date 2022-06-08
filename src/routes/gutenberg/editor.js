import React, { useEffect } from 'react'
import {
  BlockEditorProvider,
  BlockList,
  BlockTools,
  RichText,
  WritingFlow,
  ObserveTyping,
  useBlockProps
} from '@wordpress/block-editor'
import { SlotFillProvider, Popover } from '@wordpress/components'
import { useState } from '@wordpress/element'
import { View } from '@wordpress/primitives'

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
//
// registerBlockType('medienhaus/image', {
//   apiVersion: 2,
//   title: 'mhImage',
//   description: '',
//   category: 'media',
//   attributes: {
//     url: { type: 'string' },
//     alt: { type: 'string' },
//     author: { type: 'string' },
//     license: { type: 'string' }
//   },
//   edit: ({ attributes, clientId, setAttributes }) => {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const blockProps = useBlockProps()
//     const { url, alt, author, license } = attributes
//     const onChangeAuthor = nextAuthor => setAttributes({ alt: nextAuthor })
//     const onChangeLicense = nextLicense => setAttributes({ license: nextLicense })
//     const onChangeAlt = nextAlt => setAttributes({ alt: nextAlt })
//     return (
//       <div className="center" {...blockProps}>
//         {!url && 'Loading'}
//         <img src={url} alt={alt} key={clientId} />
//         <input type="text" placeholder="author, credits, et cetera" value={author} onChange={onChangeAuthor} />
//         <select id="license" name="license" value={license} onChange={onChangeLicense}>
//           <option value="cc0">CC0 1.0</option>
//           <option value="cc-by">CC BY 4.0</option>
//           <option value="cc-by-sa">CC BY-SA 4.0</option>
//           <option value="cc-by-nc">CC BY-NC 4.0</option>
//           <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
//           <option value="cc-by-nd">CC BY-ND 4.0</option>
//           <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
//         </select>
//         <TextareaAutosize rows={alt.split('\n').length} value={alt} onChange={onChangeAlt} />
//       </div>
//     )
//   }
// })
//
// registerBlockType('medienhaus/audio', {
//   apiVersion: 2,
//   title: 'Audio',
//   description: '',
//   category: 'media',
//   attributes: {
//     url: { type: 'string' },
//     name: { type: 'string' },
//     alt: { type: 'string' },
//     author: { type: 'string' },
//     license: { type: 'string' }
//   },
//   edit: ({ attributes }) => {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const blockProps = useBlockProps()
//     const { url, name, author, license, alt } = attributes
//     return (
//       <div {...blockProps}>
//         {!url && 'Loading'}
//         <audio className="center" controls>
//           <source src={url} />
//         </audio>
//         <input type="text" value={name} disabled />
//         <input type="text" value={author} disabled />
//         <select id="license" name="license" value={license} disabled>
//           <option value="cc0">CC0 1.0</option>
//           <option value="cc-by">CC BY 4.0</option>
//           <option value="cc-by-sa">CC BY-SA 4.0</option>
//           <option value="cc-by-nc">CC BY-NC 4.0</option>
//           <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
//           <option value="cc-by-nd">CC BY-ND 4.0</option>
//           <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
//         </select>
//         <textarea rows={alt.split('\n').length} value={alt} disabled />
//       </div>
//     )
//   }
// })
//
// registerBlockType('medienhaus/video', {
//   apiVersion: 2,
//   title: 'Video',
//   description: '',
//   category: 'media',
//   attributes: {
//     content: { type: 'string' }
//   },
//   edit: ({ attributes }) => {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const blockProps = useBlockProps()
//     const { content } = attributes
//     return (
//       <div {...blockProps}>
//         {!content && 'Loading'}
//         {content}
//       </div>
//     )
//   }
// })
//
// registerBlockType('medienhaus/livestream', {
//   apiVersion: 2,
//   title: 'Livestream',
//   description: '',
//   category: 'media',
//   attributes: {
//     content: { type: 'string' }
//   },
//   edit: ({ attributes }) => {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const blockProps = useBlockProps()
//     const { content } = attributes
//     return (
//       <div {...blockProps}>
//         {!content && 'Loading'}
//         {content}
//       </div>
//     )
//   }
// })
//
// registerBlockType('medienhaus/playlist', {
//   apiVersion: 2,
//   title: 'Playlist',
//   description: '',
//   category: 'media',
//   attributes: {
//     content: { type: 'string' }
//   },
//   edit: ({ attributes }) => {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const blockProps = useBlockProps()
//     const { content } = attributes
//     return (
//       <div {...blockProps}>
//         {!content && 'Loading'}
//         {content}
//       </div>
//     )
//   }
// })
//
// registerBlockType('medienhaus/bigbluebutton', {
//   apiVersion: 2,
//   title: 'BigBlueButton-Session',
//   description: '',
//   category: 'media',
//   attributes: {
//     content: { type: 'string' }
//   },
//   edit: ({ attributes }) => {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const blockProps = useBlockProps()
//     const { content } = attributes
//     return (
//       <div {...blockProps}>
//         {!content && 'Loading'}
//         {content}
//       </div>
//     )
//   }
// })

function GutenbergEditor ({ content = [], blockTypes = ['text', 'heading', 'list', 'code', 'video'], onChange }) {
  const [blocks, setBlocks] = useState(content)

  useEffect(() => {
    // register
    registerFormatType('bold', bold)
    registerFormatType('italic', italic)
    registerFormatType('strikethrough', strikethrough)

    // registerBlockType(code.metadata, { ...code.settings, transforms: null })
    // registerBlockType(list.metadata, { ...list.settings, transforms: null })
    // registerBlockType(paragraph.metadata, { ...paragraph.settings, transforms: null })

    if (blockTypes.includes('text')) registerCoreBlocks([paragraph])
    if (blockTypes.includes('list')) registerCoreBlocks([list])
    if (blockTypes.includes('code')) registerCoreBlocks([code])

    if (blockTypes.includes('video')) {
      registerBlockType('medienhaus/video', {
        apiVersion: 2,
        name: 'medienhaus/video',
        title: 'Video',
        category: 'text',
        description: 'PeerTube Video',
        keywords: ['peertube', 'video'],
        icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm.5 16c0 .3-.2.5-.5.5H5c-.3 0-.5-.2-.5-.5V9.8l4.7-5.3H19c.3 0 .5.2.5.5v14zM10 15l5-3-5-3v6z" />
        </svg>,
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
          const [urlInput, setUrlInput] = useState(content || '')

          const onSubmit = (event) => {
            if (event) event.preventDefault()

            setAttributes({ content: urlInput })
          }

          const isValidUrl = (url) => {
            return url && url.startsWith && url.startsWith('https://stream.udk-berlin.de/')
          }

          if (isValidUrl(content)) {
            return (
              <View {...blockProps}>
                <iframe
                  src={`https://stream.udk-berlin.de/videos/embed/${content.replace('https://stream.udk-berlin.de/w/', '')}`}
                  frameBorder="0"
                  title={content}
                  sandbox="allow-same-origin allow-scripts"
                  allowFullScreen="allowfullscreen"
                  width="560"
                  height="315"
                  style={{ width: '100%', aspectRatio: '16 / 9', border: 'calc(var(--margin) * 0.2) solid var(--color-fg)' }}
                />
              </View>
            )
          }

          return (
            <View {...blockProps}>
              <form onSubmit={onSubmit}>
                <input
                  type="url"
                  value={urlInput}
                  placeholder="Enter URL to embed here…"
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <button type="submit" disabled={!isValidUrl(urlInput)}>Embed Video</button>
              </form>
            </View>
          )
        }
      })
    }

    if (blockTypes.includes('heading')) {
      registerBlockType('medienhaus/heading', {
        apiVersion: 2,
        name: 'medienhaus/heading',
        title: 'Heading',
        category: 'text',
        description: 'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.',
        keywords: ['title', 'subtitle'],
        textdomain: 'default',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M6.2 5.2v13.4l5.8-4.8 5.8 4.8V5.2z" />
        </svg>,
        supports: {
          html: false
          // __experimentalSlashInserter: true
        },
        attributes: {
          content: {
            type: 'string'
          }
        },
        edit: (props) => {
          const {
            attributes: { content },
            setAttributes,
            onRemove
          } = props

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const blockProps = useBlockProps()

          const onChangeContent = (newContent) => {
            setAttributes({ content: newContent })
          }
          return (
            <RichText
              {...blockProps}
              tagName="h2"
              placeholder="Heading"
              onChange={onChangeContent}
              onRemove={onRemove}
              value={content}
              disableLineBreaks
            />
          )
        }
      })
    }

    return () => {
      // Unregister
      unregisterBlockType('core/paragraph')
      unregisterBlockType('core/code')
      unregisterBlockType('core/list')
      unregisterBlockType('medienhaus/video')
      unregisterBlockType('medienhaus/heading')
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

  return (
    <BlockEditorProvider
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
                <BlockList />
              </ObserveTyping>
            </WritingFlow>
          </BlockTools>
          <Popover.Slot />
        </SlotFillProvider>
      </ShortcutProvider>
    </BlockEditorProvider>
  )
}

export default GutenbergEditor
