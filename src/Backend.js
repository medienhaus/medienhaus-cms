function makeRequest (url, payload, method = 'POST', authenticate = true) {
  const requestMetadata = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }

  if (authenticate) {
    requestMetadata.headers['Medienhaus-Matrix-Server-Base-Url'] = process.env.REACT_APP_MATRIX_BASE_URL
    requestMetadata.headers['Medienhaus-Matrix-Access-Token'] = localStorage.getItem('medienhaus_access_token')
    requestMetadata.headers['Medienhaus-Matrix-User-Id'] = localStorage.getItem('medienhaus_user_id')
  }

  return fetch(`${process.env.REACT_APP_MEDIENHAUS_BACKEND_API_ENDPOINT}/${url}`, requestMetadata)
    .then(res => res.json())
}

function makeAnonymousRequest (url, payload, method = 'POST') {
  return makeRequest(url, payload, method, false)
}

export {
  makeRequest,
  makeAnonymousRequest
}
