import React, { useEffect } from 'react'
import {
  BlockEditorProvider,
  BlockList,
  BlockTools,
  WritingFlow,
  ObserveTyping,
  useBlockProps
} from '@wordpress/block-editor'
import { SlotFillProvider, Popover } from '@wordpress/components'
import { useState } from '@wordpress/element'

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

registerFormatType('bold', bold)
registerFormatType('italic', italic)
registerFormatType('strikethrough', strikethrough)

registerCoreBlocks([paragraph, image, heading, list, quote, code])

registerBlockType('gutenberg-examples/example-dynamic', {
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
})

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
