import React from 'react'
import GutenbergEditor from './editor'

import '@wordpress/components/build-style/style.css'
import '@wordpress/block-editor/build-style/style.css'
import '@wordpress/block-library/build-style/style.css'
import '@wordpress/block-library/build-style/editor.css'
import '@wordpress/block-library/build-style/theme.css'

const Gutenberg = () => {
  return (
    <GutenbergEditor />
  )
}

export default Gutenberg
