import React, { useState } from 'react'
import { ReactComponent as TextIcon } from '../../../assets/icons/remix/text.svg'
import { useTranslation } from 'react-i18next'

const ProjectDescription = ({ description: intro, callback }) => {
  const { t } = useTranslation('projects')
  const [saved, setSaved] = useState(false)
  const [description, setDescription] = useState(intro)
  const [backupDescription, setBackupDescription] = useState()

  const onSave = async () => {
    console.log(description)
    if (description) {
      await callback(description)
    } else {
      setDescription(backupDescription)
      setSaved('Description can\'t be empty')
      setTimeout(() => {
        setSaved()
      }, 1000)
    }
  }

  return (
    <>
      <div className="editor">
        <div className="left">
          <button disabled>↑</button>
          <figure className="icon-bg"><TextIcon fill="var(--color-fg)" /></figure>
          <button disabled>↓</button>
        </div>
        <div className="center">
          <textarea
            style={{ height: '100%', border: 'none' }}
            value={description}
            onClick={() => setBackupDescription(description)}
            onChange={(e) => {
              setDescription(e.target.value)
            }}
            placeholder={`${t('Please add a short description of your project.')} ${t('This field is required before publishing.')}`}
            onBlur={() => onSave()}
          />
          <p>{saved}</p>
        </div>
        <div className="right">
          <button disabled>×</button>
        </div>
      </div>
    </>
  )
}
export default ProjectDescription
