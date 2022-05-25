import config from './config.json'

class MedienhausAPI {
  constructor () {
    this.apiUrl = config.medienhaus.api
  }

  async path (roomId) {
    const fetchPath = await fetch(this.apiUrl + roomId + '/path')
    const response = await fetchPath.json()
    return response
  }

  async tree (roomId) {
    const fetchPath = await fetch(this.apiUrl + roomId + '/tree')
    const response = await fetchPath.json()
    return response
  }

  async id (roomId) {
    const fetchPath = await fetch(this.apiUrl + roomId)
    const response = await fetchPath.json()
    return response
  }
}
export { MedienhausAPI }
