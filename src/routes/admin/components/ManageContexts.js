import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateContext from './CreateContext'

const ManageContexts = (props) => {
  const { t } = useTranslation('admin')
  const [newContext, setNewContext] = useState('')
  const [parent] = useState('')

  function onSubmit (e) {
    e.preventDefault()
    console.log('created Context ' + newContext)
  }

  return (
    <>
      <h2>Manage Contexts</h2>
      <p>Crazy circles</p>
      <CreateContext t={t} parent={parent} matrixClient={props.matrixClient} setNewContext={setNewContext} callback={onSubmit} />
    </>
  )
}
export default ManageContexts
