import { useState, useEffect } from 'react'

const fetchMatrix = async (room) => {
  const req = {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') }
  }

  try {
    const allMessages = localStorage.getItem('medienhaus_hs_url') + `_matrix/client/r0/rooms/${room}/messages?limit=999999&dir=b`
    const result = await fetch(allMessages, req)
    const data = await result.json()
    const htmlString = data.chunk.map(type => {
      if (type.type === 'm.room.message' && type.content['m.new_content'] === undefined && type.redacted_because === undefined) {
        const content = type.content
        const bar = { ...content, ...{ eventId: type.event_id } }
        return bar
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
  const [cms, setCms] = useState([])

  useEffect(() => {
    let canceled
    setFetching(true);
    (async () => {
      try {
        const res = await fetchMatrix(path)
        const text = res.filter(x => x !== null)
        canceled || setCms(text)
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
