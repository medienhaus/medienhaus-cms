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
import { SlotFillProvider, Popover, BlockQuotation } from '@wordpress/components'
import { useState } from '@wordpress/element'

import TextareaAutosize from 'react-textarea-autosize'

import { registerCoreBlocks } from '@wordpress/block-library'
import * as paragraph from '@wordpress/block-library/build/paragraph'
import * as image from '@wordpress/block-library/build/image'
import * as heading from '@wordpress/block-library/build/heading'
import * as list from '@wordpress/block-library/build/list'
import * as quote from '@wordpress/block-library/build/quote'
import * as code from '@wordpress/block-library/build/code'
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts'

import { registerBlockType } from '@wordpress/blocks'
import { registerFormatType } from '@wordpress/rich-text'
import { bold } from '@wordpress/format-library/build/bold'
import { italic } from '@wordpress/format-library/build/italic'
import { strikethrough } from '@wordpress/format-library/build/strikethrough'

// import mhQuote from './blocks/mh-quote.json'

registerFormatType('bold', bold)
registerFormatType('italic', italic)
registerFormatType('strikethrough', strikethrough)

registerCoreBlocks([paragraph, image, heading, list, quote, code])

registerBlockType('medienhaus/quote', {
  apiVersion: 2,
  title: 'mhQuote',
  description: '',
  category: 'text',
  attributes: {
    content: { type: 'string' }
  },
  example: {
    attributes: {
      content: 'I think, therefore I am.'
    }
  },
  edit: ({ attributes, setAttributes, onReplace }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    const { content } = attributes
    return (BlockQuotation, blockProps, (RichText, {
      identifier: 'value',
      multiline: true,
      value: content,
      onChange: nextValue => setAttributes({
        value: nextValue
      }),
      onRemove: forward => {
        if (!forward) {
          onReplace([])
        }
      },
      onReplace: onReplace,
      textAlign: 'right'
    })) /*, (<div className="center" {...blockProps}>
        {!content && 'Loading'}
        {content}
      </div>
    ) */
  }
})

registerBlockType('medienhaus/image', {
  apiVersion: 2,
  title: 'mhImage',
  description: '',
  category: 'media',
  attributes: {
    url: { type: 'string' },
    alt: { type: 'string' },
    author: { type: 'string' },
    license: { type: 'string' }
  },
  edit: ({ attributes, clientId, setAttributes }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    const { url, alt, author, license } = attributes
    const onChangeAuthor = nextAuthor => setAttributes({ alt: nextAuthor })
    const onChangeLicense = nextLicense => setAttributes({ license: nextLicense })
    const onChangeAlt = nextAlt => setAttributes({ alt: nextAlt })
    return (
      <div className="center" {...blockProps}>
        {!url && 'Loading'}
        <img src={url} alt={alt} key={clientId} />
        <input type="text" placeholder="author, credits, et cetera" value={author} onChange={onChangeAuthor} />
        <select id="license" name="license" value={license} onChange={onChangeLicense}>
          <option value="cc0">CC0 1.0</option>
          <option value="cc-by">CC BY 4.0</option>
          <option value="cc-by-sa">CC BY-SA 4.0</option>
          <option value="cc-by-nc">CC BY-NC 4.0</option>
          <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
          <option value="cc-by-nd">CC BY-ND 4.0</option>
          <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
        </select>
        <TextareaAutosize rows={alt.split('\n').length} value={alt} onChange={onChangeAlt} />
      </div>
    )
  }
})

registerBlockType('medienhaus/audio', {
  apiVersion: 2,
  title: 'Audio',
  description: '',
  category: 'media',
  attributes: {
    url: { type: 'string' },
    name: { type: 'string' },
    alt: { type: 'string' },
    author: { type: 'string' },
    license: { type: 'string' }
  },
  edit: ({ attributes }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    const { url, name, author, license, alt } = attributes
    return (
      <div {...blockProps}>
        {!url && 'Loading'}
        <audio className="center" controls>
          <source src={url} />
        </audio>
        <input type="text" value={name} disabled />
        <input type="text" value={author} disabled />
        <select id="license" name="license" value={license} disabled>
          <option value="cc0">CC0 1.0</option>
          <option value="cc-by">CC BY 4.0</option>
          <option value="cc-by-sa">CC BY-SA 4.0</option>
          <option value="cc-by-nc">CC BY-NC 4.0</option>
          <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
          <option value="cc-by-nd">CC BY-ND 4.0</option>
          <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
        </select>
        <textarea rows={alt.split('\n').length} value={alt} disabled />
      </div>
    )
  }
})

registerBlockType('medienhaus/video', {
  apiVersion: 2,
  title: 'Video',
  description: '',
  category: 'media',
  attributes: {
    content: { type: 'string' }
  },
  edit: ({ attributes }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    const { content } = attributes
    return (
      <div {...blockProps}>
        {!content && 'Loading'}
        {content}
      </div>
    )
  }
})

registerBlockType('medienhaus/livestream', {
  apiVersion: 2,
  title: 'Livestream',
  description: '',
  category: 'media',
  attributes: {
    content: { type: 'string' }
  },
  edit: ({ attributes }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    const { content } = attributes
    return (
      <div {...blockProps}>
        {!content && 'Loading'}
        {content}
      </div>
    )
  }
})

registerBlockType('medienhaus/playlist', {
  apiVersion: 2,
  title: 'Playlist',
  description: '',
  category: 'media',
  attributes: {
    content: { type: 'string' }
  },
  edit: ({ attributes }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    const { content } = attributes
    return (
      <div {...blockProps}>
        {!content && 'Loading'}
        {content}
      </div>
    )
  }
})

registerBlockType('medienhaus/bigbluebutton', {
  apiVersion: 2,
  title: 'BigBlueButton-Session',
  description: '',
  category: 'media',
  attributes: {
    content: { type: 'string' }
  },
  edit: ({ attributes }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    const { content } = attributes
    return (
      <div {...blockProps}>
        {!content && 'Loading'}
        {content}
      </div>
    )
  }
})

/* registerBlockType('gutenberg-examples/example-dynamic', {
  apiVersion: 2,
  title: 'Example: Custom block',
  category: 'widgets',

  edit: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    const posts = []

    return (
      <div {...blockProps}>
        {!posts && 'Loading'}
        {posts && posts.length === 0 && 'No Posts'}
        {posts && posts.length > 0 && (
          <a href={posts[0].link}>
            {posts[0].title.rendered}
          </a>
        )}
      </div>
    )
  }
}) */

function GutenbergEditor ({ content = [] }) {
  const [blocks, updateBlocks] = useState(content)

  // Actually update our internal state if the content passed from external
  // consumers of this component changes
  useEffect(() => {
    updateBlocks(content)
  }, [content])

  return (
    <BlockEditorProvider
      value={blocks}
      onInput={(blocks) => updateBlocks(blocks)}
      onChange={(blocks) => { console.log(blocks); updateBlocks(blocks) }}
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
