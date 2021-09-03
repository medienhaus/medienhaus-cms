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

registerCoreBlocks([paragraph, image, heading, list, quote, code])

function GutenbergEditor () {
  const [blocks, updateBlocks] = useState([])

  return (
    <BlockEditorProvider
      value={blocks}
      onInput={(blocks) => updateBlocks(blocks)}
      onChange={(blocks) => { console.log(blocks); updateBlocks(blocks) }}
    >
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
    </BlockEditorProvider>
  )
}

export default GutenbergEditor
