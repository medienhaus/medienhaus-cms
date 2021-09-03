import React, { useEffect, useRef, useState } from 'react'
import Matrix from '../../../Matrix'
import FetchCms from '../../../components/matrix_fetch_cms'
import Editor, { renderToHtml } from 'rich-markdown-editor'
import debounce from 'lodash/debounce'
import { Loading } from '../../../components/loading'
import AddContent from '../AddContent'
import List from './List'
import Code from './Code'
import reorder from './matrix_reorder_rooms'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import TextareaAutosize from 'react-textarea-autosize'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

import { ReactComponent as HeadingIcon } from '../../../assets/icons/remix/h-1.svg'
import { ReactComponent as AudioIcon } from '../../../assets/icons/remix/volume-up.svg'
import { ReactComponent as ImageIcon } from '../../../assets/icons/remix/image.svg'
import { ReactComponent as TextIcon } from '../../../assets/icons/remix/text.svg'
import { ReactComponent as UlIcon } from '../../../assets/icons/remix/list-unordered.svg'
import { ReactComponent as OlIcon } from '../../../assets/icons/remix/list-ordered.svg'
import { ReactComponent as QuoteIcon } from '../../../assets/icons/remix/quote.svg'
import { ReactComponent as CodeIcon } from '../../../assets/icons/remix/code.svg'
import { ReactComponent as VideoIcon } from '../../../assets/icons/remix/video.svg'
import { ReactComponent as PlaylistIcon } from '../../../assets/icons/remix/playlist.svg'
import { ReactComponent as PictureInPictureIcon } from '../../../assets/icons/remix/picture-in-picture.svg'
import { ReactComponent as LocationIcon } from '../../../assets/icons/remix/location.svg'
import { ReactComponent as DateIcon } from '../../../assets/icons/remix/date.svg'

import locations from '../../../assets/data/locations.json'

const DisplayContent = ({ block, index, blocks, projectSpace, reloadSpace, time, present }) => {
  const [clickedDelete, setClickedDelete] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [json, setJson] = useState({})
  let { cms, error, fetching } = FetchCms(block.room_id)
  cms = cms[0]
  const matrixClient = Matrix.getMatrixClient()
  const isMounted = useRef(true)
  const [content, setContent] = useState('')

  useEffect(() => {
    cms?.body && setContent(cms.body)
  }, [cms])

  useEffect(() => {
    const fetchJson = async () => setJson(await matrixClient.getStateEvent(block.room_id, 'dev.medienhaus.meta'))
    fetchJson()
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [block.room_id, matrixClient])

  const onSave = async (roomId, text) => {
    setReadOnly(true)
    try {
      if (json.type === 'ul' || json.type === 'ol') {
        const list = JSON.parse(localStorage.getItem(roomId)).map(li => li.text).join('\n')
        console.log(list)
        const save = await matrixClient.sendMessage(roomId, {
          body: list,
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: renderToHtml(list)
        })
        if ('event_id' in save) {
          setSaved('Saved!')
          setTimeout(() => {
            setSaved()
          }, 1000)
        }
      } else if (json.type === 'code') {
        const save = await matrixClient.sendMessage(roomId, {
          body: localStorage.getItem(roomId),
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: '<pre><code>' + localStorage.getItem(roomId) + '</code></pre>'
        })
        if ('event_id' in save) {
          setSaved('Saved!')
          setTimeout(() => {
            setSaved()
          }, 1000)
        }
      } else if (text) {
        const save = await matrixClient.sendMessage(roomId, {
          body: text,
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: '<h2>' + localStorage.getItem(roomId) + '</h2>'
        })
        if ('event_id' in save) {
          setSaved('Saved!')
          setTimeout(() => {
            setSaved()
          }, 1000)
        }
      } else {
        const save = await matrixClient.sendMessage(roomId, {
          body: localStorage.getItem(roomId),
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: renderToHtml(localStorage.getItem(roomId))
        })
        if ('event_id' in save) {
          setSaved('Saved!')
          setTimeout(() => {
            setSaved()
          }, 1000)
        }
      }
      time()
    } catch (e) {
      console.error('error while trying to save: ' + e)
      setSaved('Couldn’t save!')
      setTimeout(() => {
        setSaved()
      }, 1000)
    } finally {
      setReadOnly(false)
    }
  }

  const onDelete = async (e, roomId, name, index) => {
    e.preventDefault()
    setDeleting(true)
    setReadOnly(true)
    try {
      const roomType = name.split('_')
      await matrixClient.setRoomName(roomId, 'x_' + roomType[1])
      const count = await matrixClient.getJoinedRoomMembers(roomId)
      Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
        localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(roomId, name)
      })
      await matrixClient.leave(roomId)
      blocks.forEach((block, i) => {
        if (i > index) {
          reorder(block.name, block.room_id, true)
        }
      })
      reloadSpace()
    } catch (err) {
      console.error(err)
      setDeleting(`couldn’t delete ${json.type}, please try again or try reloading the page`)
      setTimeout(() => {
        setDeleting()
      }, 2000)
    } finally {
      setDeleting()
      setReadOnly(false)
    }
  }

  const changeOrder = async (roomId, name, direction) => {
    setLoading(true)
    setReadOnly(true)
    const active = name.split('_')
    const order = parseInt(active[0])
    const newOrder = order + direction
    const passive = blocks[newOrder].name.split('_')
    const passiveRoom = blocks[newOrder].room_id
    try {
      await matrixClient.setRoomName(roomId, newOrder + '_' + active[1])
        .then(await matrixClient.setRoomName(passiveRoom, order + '_' + passive[1]))
      reloadSpace()
    } catch (err) {
      console.error(err)
    } finally {
      setReadOnly(false)
      setLoading(false)
    }
  }

  if (fetching || loading) {
    return <div style={{ height: '120px' }}><Loading /></div>
  }

  if (error) {
    console.error(error)
    return
  }

  return (
    <>
      {index === 0 && <AddContent number={index} projectSpace={projectSpace} blocks={blocks} reloadSpace={reloadSpace} />}
      <div className="editor">
        <div className="left">
          <LoadingSpinnerButton key={'up_' + block.room_id} disabled={index < 1} onClick={() => changeOrder(block.room_id, block.name, -1)}>↑</LoadingSpinnerButton>
          <figure className="icon-bg">
            {
              json.type === 'heading'
                ? <HeadingIcon fill="var(--color-fg)" />
                : json.type === 'audio'
                  ? <AudioIcon fill="var(--color-fg)" />
                  : json.type === 'image'
                    ? <ImageIcon fill="var(--color-fg)" />
                    : json.type === 'ul'
                      ? <UlIcon fill="var(--color-fg)" />
                      : json.type === 'ol'
                        ? <OlIcon fill="var(--color-fg)" />
                        : json.type === 'quote'
                          ? <QuoteIcon fill="var(--color-fg)" />
                          : json.type === 'code'
                            ? <CodeIcon fill="var(--color-fg)" />
                            : json.type === 'video'
                              ? <VideoIcon fill="var(--color-fg)" />
                              : json.type === 'playlist'
                                ? <PlaylistIcon fill="var(--color-fg)" />
                                : json.type === 'location'
                                  ? <LocationIcon fill="var(--color-fg)" />
                                  : json.type === 'date'
                                    ? <DateIcon fill="var(--color-fg)" />
                                    : json.type === 'bbb'
                                      ? <PictureInPictureIcon fill="var(--color-fg)" />
                                      : <TextIcon fill="var(--color-fg)" />
            }
          </figure>
          <LoadingSpinnerButton key={'down_' + block.room_id} disabled={index === blocks.length - 1} onClick={() => changeOrder(block.room_id, block.name, 1)}>↓</LoadingSpinnerButton>
        </div>
        {cms?.msgtype === 'm.image'
          ? (
            <div>
              <figure className="center">
                <img src={matrixClient.mxcUrlToHttp(cms.url)} alt={cms?.info?.alt} key={block.room_id} />
              </figure>
              <input type="text" placeholder="author, credits, et cetera" value={cms.info.author} disabled />
              <select id="license" name="license" value={cms.info.license} disabled>
                <option value="cc0">CC0 1.0</option>
                <option value="cc-by">CC BY 4.0</option>
                <option value="cc-by-sa">CC BY-SA 4.0</option>
                <option value="cc-by-nc">CC BY-NC 4.0</option>
                <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
                <option value="cc-by-nd">CC BY-ND 4.0</option>
                <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
              </select>
              <TextareaAutosize rows={cms.info.alt.split('\n').length} value={cms.info.alt} disabled />
            </div>
            )
          : cms?.msgtype === 'm.audio'
            ? (
              <div>
                <audio className="center" controls>
                  <source src={matrixClient.mxcUrlToHttp(cms.url)} />
                </audio>
                <input type="text" value={cms.info.name} disabled />
                <input type="text" value={cms.info.author} disabled />
                <select id="license" name="license" value={cms.info.license} disabled>
                  <option value="cc0">CC0 1.0</option>
                  <option value="cc-by">CC BY 4.0</option>
                  <option value="cc-by-sa">CC BY-SA 4.0</option>
                  <option value="cc-by-nc">CC BY-NC 4.0</option>
                  <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
                  <option value="cc-by-nd">CC BY-ND 4.0</option>
                  <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
                </select>
                <TextareaAutosize rows={cms.info.alt.split('\n').length} value={cms.info.alt} disabled />
              </div>
              )
            : json.type === 'ul'
              ? <List onSave={() => onSave(block.room_id)} storage={(list) => localStorage.setItem(block.room_id, list)} populated={cms?.body} type="ul" />
              : json.type === 'ol'
                ? <List onSave={() => onSave(block.room_id)} storage={(list) => localStorage.setItem(block.room_id, list)} populated={cms?.body} type="ol" />
                : json.type === 'code'
                  ? <Code onSave={() => onSave(block.room_id)} storage={(code) => localStorage.setItem(block.room_id, code)} saved={saved} content={cms?.body} />
                  : (json.type === 'video' || json.type === 'livestream' || json.type === 'playlist')
                      ? (
                        <iframe
                          src={`https://stream.udk-berlin.de/${(json.type === 'playlist' ? 'video-playlists' : 'videos')}/embed/${cms?.body}`}
                          frameBorder="0"
                          title={cms?.body}
                          sandbox="allow-same-origin allow-scripts"
                          allowFullScreen="allowfullscreen"
                          style={{ width: '100%', aspectRatio: '16 / 9', border: 'calc(var(--margin) * 0.2) solid var(--color-fg)' }}
                        />
                        )
                      : json.type === 'location'
                        ? (
                          <div
                            className={cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-')) === '0.0, 0.0' && 'center'}
                          >
                            {
                            cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-')) !== '0.0, 0.0' &&
                              <MapContainer className="center" center={[cms.body.substring(0, cms.body.indexOf(',')), cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-'))]} zoom={17} scrollWheelZoom={false} placeholder>
                                <TileLayer
                                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[cms.body.substring(0, cms.body.indexOf(',')), cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-'))]}>
                                  <Popup>
                                    {locations.find(coord => coord.coordinates === cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.lastIndexOf('-'))).name}
                                  </Popup>
                                </Marker>
                              </MapContainer>
                          }
                            {cms.body.substring(cms.body.lastIndexOf('-') + 1).length > 0 && <input type="text" value={cms.body.substring(cms.body.lastIndexOf('-') + 1)} disabled />}
                          </div>
                          )
                        : json.type === 'date'
                          ? <div className="center">
                            {cms.body.split(' ')[0] && <input type="date" value={cms.body.split(' ')[0]} disabled required />}
                            {cms.body.split(' ')[1] && <input type="time" value={cms.body.split(' ')[1]} disabled required />}
                            {/* eslint-disable-next-line react/jsx-indent */}
                            </div>
                          : json.type === 'bbb'
                            ? <div>BigBlueButton-Session<br /><a href={cms?.body} target="_blank" rel="external nofollow noopener noreferrer">{cms?.body}</a></div>
                            : (json.type === 'video' || json.type === 'livestream' || json.type === 'playlist')
                                ? (
                                  <iframe
                                    src={`https://stream.udk-berlin.de/${(json.type === 'playlist' ? 'video-playlists' : 'videos')}/embed/${cms?.body}`}
                                    frameBorder="0"
                                    title={cms?.body}
                                    sandbox="allow-same-origin allow-scripts"
                                    allowFullScreen="allowfullscreen"
                                    style={{ width: '100%', aspectRatio: '16 / 9', border: 'calc(var(--margin) * 0.2) solid var(--color-fg)' }}
                                  />
                                  )
                                : json.type === 'heading'
                                  ? <div className="center">
                                    <input
                                      type="text"
                                      value={content}
                                      onChange={(e) => setContent(e.target.value)}
                                      onBlur={(e) => {
                                        if (cms !== undefined && content !== cms.body) {
                                          onSave(block.room_id, content)
                                        }
                                      }}
                                    />
                                  </div>
                                  : (<div className="center">
                                    <Editor
                                      dark={window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches}
                                      defaultValue={cms?.body}
                                      disableExtensions={['blockmenu', 'image', 'embed', 'table', 'tr', 'th', 'td', 'bullet_list', 'ordered_list', 'checkbox_item', 'checkbox_list', 'container_notice', 'blockquote', 'heading', 'hr', 'highlight']}
                                      placeholder={json.type}
                                      readOnly={readOnly}
                                      onSave={({ done }) => {
                                        if (localStorage.getItem(block.room_id) !== null && cms !== undefined && cms.body !== localStorage.getItem(block.room_id)) {
                                          onSave(block.room_id)
                                          localStorage.removeItem(block.room_id)
                                        } else if (localStorage.getItem(block.room_id) !== null && cms === undefined) {
                                          onSave(block.room_id)
                                          localStorage.removeItem(block.room_id)
                                        }
                                      }}
                                      onChange={debounce((value) => {
                                        const text = value()
                                        localStorage.setItem(block.room_id, text)
                                      }, 250)}
                                      handleDOMEvents={{
                                        focus: () => {
                                        }, // this could set MatrixClient"User.presence" to 'online', "User.currentlyActive" or 'typing. depending on which works best.
                                        blur: (e) => {
                                          if (localStorage.getItem(block.room_id) !== null && cms !== undefined && cms.body !== localStorage.getItem(block.room_id)) {
                                            onSave(block.room_id)
                                            localStorage.removeItem(block.room_id)
                                          } else if (localStorage.getItem(block.room_id) !== null && cms === undefined) {
                                            onSave(block.room_id)
                                            localStorage.removeItem(block.room_id)
                                          }
                                        }
                                      }}
                                      key={block.room_id}
                                    />
                                  </div>
                                    )}

        <div className="right">
          <button
            key={'delete' + index} disabled={deleting} onClick={(e) => {
              if (clickedDelete) {
                onDelete(e, block.room_id, block.name, index)
                setClickedDelete(false)
                reloadSpace()
              } else {
                e.preventDefault()
                setClickedDelete(true)
              }
                <p>{deleting}</p> // feedback that deleting was succesfull or has failed
            }}
          >
            {clickedDelete ? '❓' : deleting ? <Loading /> : '×'}
          </button>
        </div>
      </div>
      <AddContent number={index + 1} projectSpace={projectSpace} blocks={blocks} reloadSpace={reloadSpace} present={present} />
    </>
  )
}
export default DisplayContent
