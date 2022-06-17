import config from '../config.json'

export async function triggerApiUpdate (roomId, parentId) {
  const body = {
    depth: 1
  }
  if (parentId) body.parentId = parentId
  const updateRequest = await fetch(config.medienhaus.api + roomId + '/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  return updateRequest
}

export async function fetchTree (root) {
  const apiCall = await fetch(config.medienhaus.api + root + '/tree')
  const response = await apiCall.json()
  return response.children
}

export async function fetchContextTree (root) {
  const apiCall = await fetch(config.medienhaus.api + root + '/tree/filter/type/context')
  const response = await apiCall.json()
  return response.children
}

export async function fetchId (id) {
  const apiCall = await fetch(config.medienhaus.api + id)
  const response = await apiCall.json()
  return response
}
