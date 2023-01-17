import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'

import { useState } from '@wordpress/element'
import { View } from '@wordpress/primitives'
import FileUpload from '../../../components/FileUpload'

const file = {
  apiVersion: 2,
  name: 'medienhaus/file',
  title: 'File',
  description: 'File',
  keywords: ['file'],
  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z" /><path d="M9 2.003V2h10.998C20.55 2 21 2.455 21 2.992v18.016a.993.993 0 0 1-.993.992H3.993A1 1 0 0 1 3 20.993V8l6-5.997zM5.83 8H9V4.83L5.83 8zM11 4v5a1 1 0 0 1-1 1H5v10h14V4h-8z" /></svg>,
  attributes: {
    url: {
      type: 'string'
    }
  },
  edit: (props) => {
    const {
      attributes: { url },
      attributes: { name },

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
          {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
          <a href={url} style={{ width: '100%' }} download>{name}</a>
        </View>
      )
    }

    if (file) {
      return (
        <View {...blockProps}>
          {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
          <a href={URL.createObjectURL(file)} style={{ width: '100%' }} download>
            {file.name}
          </a>
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
          fileType="application"
          handleSubmission={handleFormSubmission}
        />
      </View>
    )
  }
}

export default file
