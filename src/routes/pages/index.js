import React, { useEffect, useState } from 'react'
import useJoinedSpaces from '../../components/matrix_joined_spaces'

import Page from './Page'
import { Loading } from '../../components/loading'

const Pages = () => {
  const [pages, setPages] = useState()
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(false)

  useEffect(() => {
    const filterSpaces = () => {
      setPages(joinedSpaces?.filter(space => !space.meta?.deleted && space.meta.type === 'page'))
    }
    joinedSpaces && filterSpaces()
  }, [joinedSpaces])

  const removeProject = (index) => {
    setPages(pages.filter((name, i) => i !== index))
  }

  if (fetchSpaces) return <Loading />
  if (spacesErr) return <p>There was an error: {spacesErr}</p>
  return (
    <Page pages={pages} callback={removeProject} />
  )
}
export default Pages
