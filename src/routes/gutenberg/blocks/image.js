import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'

import { useState } from '@wordpress/element'
import { View } from '@wordpress/primitives'
import FileUpload from '../../../components/FileUpload'

const image = {
  apiVersion: 2,
  name: 'medienhaus/image',
  title: 'Image',
  description: 'Image',
  keywords: ['image'],
  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z" /><path d="M4.828 21l-.02.02-.021-.02H2.992A.993.993 0 0 1 2 20.007V3.993A1 1 0 0 1 2.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H4.828zM20 15V5H4v14L14 9l6 6zm0 2.828l-6-6L6.828 19H20v-1.172zM8 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="var(--color-fg)" /></svg>,
  attributes: {
    url: {
      type: 'string'
    }
  },
  edit: (props) => {
    const {
      attributes: { url },
      setAttributes,
      onRemove
    } = props
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [file, setFile] = useState()

    if (url) {
      return (
        <View {...blockProps}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={url} />
        </View>
      )
    }

    if (file) {
      return (
        <View {...blockProps}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={URL.createObjectURL(file)} />
        </View>
      )
    }

    const handleFormSubmission = (e, selectedFile, fileName, author, license, alttext) => {
      setFile(selectedFile)
      setAttributes({ file: selectedFile, author, license, alttext })
    }

    return (
      <View {...blockProps}>
        <FileUpload
          callback={onRemove}
          fileType="image"
          handleSubmission={handleFormSubmission}
        />
      </View>
    )
  }
}

export default image
