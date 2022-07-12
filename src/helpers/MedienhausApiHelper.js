import config from '../config.json'

export const triggerApiUpdate = async (roomId, parentId) => {
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
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.debug(updateRequest)
  return updateRequest
}

export const fetchTree = async (root) => {
  const apiCall = await fetch(config.medienhaus.api + root + '/tree')
  const response = await apiCall.json()
  return response.children
}

export const fetchContextTree = async (root) => {
  const apiCall = await fetch(config.medienhaus.api + root + '/tree/filter/type/context')
  const response = await apiCall.json()
  return response
}

export const fetchId = async (id, signal = null) => {
  const apiCall = await fetch(config.medienhaus.api + id, { signal })
  const response = await apiCall.json()
  return response
}

export const fetchList = async (id) => {
  const fetchList = await fetch(config.medienhaus.api + id + '/list')
  const response = fetchList.json()
  return response
}

export const fetchPathList = async (id) => {
  const fetchPathList = await fetch(config.medienhaus.api + id + '/pathlist')
  const response = fetchPathList.json()
  return response
}

export const removeFromParent = async (id, parentIds, purge) => {
  const body = {
    parentIds: parentIds
  }
  if (purge) body.purge = true
  const deleteId = await fetch(config.medienhaus.api + id + '/fetch', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.debug(deleteId)
  return deleteId
}
