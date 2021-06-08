import { useState, useEffect } from 'react'
import Matrix from '../../Matrix'

const fetchMatrix = async (room) => {
  const req = {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') }
  }

  const matrixClient = Matrix.getMatrixClient()
  try {
    const allMessages = process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room}/messages?limit=999999&dir=b`
    const result = await fetch(allMessages, req)
    const data = await result.json()
    const htmlString = data.chunk.map(type => {
      if (type.type === 'm.room.message' && type.content.msgtype === 'm.text' && type.content['m.new_content'] === undefined) {
        const content = type.content
        // const bar = { ...content, ...{ eventId: type.event_id } } // ......sorry
        return content
      } else if (type.type === 'm.room.message' && type.content.msgtype === 'm.image') {
        const content = '![alt text](' + (matrixClient.mxcUrlToHttp(type.content.url, 1080, 640)) + ')'
        // const bar = { ...content, ...{ eventId: type.event_id } }
        console.log('image')
        return content
      } else { return null }
    }
    )
    return htmlString
  } catch (e) {
    console.log('error from fetchFaq API call' + e)
  }
}

const FetchCms = (path) => {
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(false)
  const [cms, setCms] = useState()

  useEffect(() => {
    let canceled
    setFetching(true);
    (async () => {
      try {
        const res = await fetchMatrix(path)
        const text = res.filter(x => x !== null)
        canceled || setCms(text[0])
      } catch (e) {
        canceled || setError(e)
      } finally {
        canceled || setFetching(false)
      }
    })()
    return () => { canceled = true }
  }, [path])

  return {
    cms,
    error,
    fetching

  }
}
export default FetchCms
