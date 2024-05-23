import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TextareaAutosize from 'react-textarea-autosize'
import config from '../../../config.json'

const ProjectDescription = ({ description: intro, callback, disabled = false, language = '' }) => {
  const { t } = useTranslation('content')
  const [description, setDescription] = useState(intro)
  const [backupDescription, setBackupDescription] = useState()

  const onSave = async () => {
    if (description.length > (config?.medienhaus?.limits?.descriptionMaxCharacters ? config?.medienhaus?.limits?.descriptionMaxCharacters : 500)) return
    if (description) {
      await callback(description)
    } else {
      setDescription('❗️ Description can\'t be empty')
      setTimeout(() => {
        setDescription(backupDescription)
      }, 1000)
    }
  }

  return (
    <>
      <div className="projectdescription">
        <TextareaAutosize
          minRows={6}
          value={description}
          onClick={() => setBackupDescription(description)}
          onChange={(e) => {
            setDescription(e.target.value)
          }}
          disabled={disabled}
          placeholder={`${t('Please add a short description')} in ${language}. ${t('This field is required before publishing.')}`}
          onBlur={() => onSave()}
        />
        <div className="maxlength">
          <span>{description.length + '/' + (config?.medienhaus?.limits?.descriptionMaxCharacters ? config?.medienhaus?.limits?.descriptionMaxCharacters : 500)}</span>
        </div>
      </div>
    </>
  )
}
export default ProjectDescription
