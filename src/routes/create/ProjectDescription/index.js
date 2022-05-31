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
          value={description}
          onClick={() => setBackupDescription(description)}
          onChange={(e) => {
            setDescription(e.target.value)
          }}
          placeholder={`${t('Please add a short description.')} ${t('This field is required before publishing.')}`}
          onBlur={() => onSave()}
        />
      </div>
      {description.length > 500 && (<>
        <p>{t('Characters:')} {description.length}</p>
        <p>❗️{t('Please keep the descrpition under 500 characters.')} {description.length}</p>
      </>
      )}
    </>
  )
}
export default ProjectDescription
