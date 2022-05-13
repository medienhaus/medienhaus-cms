import React from 'react'
import {
  BlockEditorProvider,
  BlockList,
  BlockTools,
  WritingFlow,
  ObserveTyping
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

registerCoreBlocks([paragraph, image, heading, list, quote, code])

function GutenbergEditor ({ content = [] }) {
  // eslint-disable-next-line new-cap
  const [blocks, updateBlocks] = useState(content)

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
