import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TextareaAutosize from 'react-textarea-autosize'

const ProjectDescription = ({ description: intro, callback }) => {
  const { t } = useTranslation('content')
  const [description, setDescription] = useState(intro)
  const [backupDescription, setBackupDescription] = useState()

  const onSave = async () => {
    if (description.length > 500) return
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
          placeholder={`${t('short description')}`}
          value={description}
          onClick={() => setBackupDescription(description)}
          onChange={(e) => {
            setDescription(e.target.value)
          }}
          onBlur={() => onSave()}
        />
        <div className="maxlength">
          <span>{description.length + '/500'}</span>
        </div>
      </div>
    </>
  )
}

export default ProjectDescription
