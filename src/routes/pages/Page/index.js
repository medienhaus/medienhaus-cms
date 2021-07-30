import React from 'react'
import Projects from '../../projects/Projects'

// import fetchCms from '../../../components/matrix_fetch_cms'

const Page = ({ pages, callback }) => {
  if (pages.length === 0) return <p>You don't have any pages.</p>
  return (
    pages.map((page, index) => {
      return (
        <section key={page.name}>
          <Projects space={page} visibility={page.published} index={index} removeProject={callback} />
        </section>
      )
    }
    )
  )
}
export default Page
