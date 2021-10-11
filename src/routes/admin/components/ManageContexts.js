import React from 'react'
import { useForm } from 'react-hook-form' // https://github.com/react-hook-form/react-hook-form
import { useTranslation } from 'react-i18next'

const ManageContexts = () => {
  const { handleSubmit } = useForm()
  const { t } = useTranslation('admin')
  return (
    <>
      <h2>Manage Contexts</h2>
      <form onSubmit={handleSubmit(console.log('object'))}>

        <div>
          <label htmlFor="name">{t('Context')}: </label>
          <input type="text" onChange={console.log('object')} />
        </div>

        <button type="submit">{t('SUBMIT')}</button>
      </form>
    </>
  )
}
export default ManageContexts
