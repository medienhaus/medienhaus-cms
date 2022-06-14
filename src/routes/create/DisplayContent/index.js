import React, { useEffect, useRef, useState } from 'react'
import Matrix from '../../../Matrix'
import FetchCms from '../../../components/matrix_fetch_cms'
import Editor, { renderToHtml } from 'rich-markdown-editor'
import debounce from 'lodash/debounce'
import { Loading } from '../../../components/loading'
import AddContent from '../AddContent'
import List from './List'
import DeleteButton from '../components/DeleteButton'
import DisplayBbb from '../components/DisplayBbb'
// import Code from './Code'
import reorder from './matrix_reorder_rooms'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import TextareaAutosize from 'react-textarea-autosize'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Trans, useTranslation } from 'react-i18next'

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
import deleteContentBlock from '../functions/deleteContentBlock'
import { Icon } from 'leaflet/dist/leaflet-src.esm'
// import DisplayPreview from '../../preview/components/DisplayPreview'

const DisplayContent = ({ block, index, blocks, projectSpace, reloadSpace, time, mapComponent, contentType }) => {
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line no-unused-vars
  const [saved, setSaved] = useState(false)
  const [json, setJson] = useState({})
  let { cms, error, fetching } = FetchCms(block.room_id)
  cms = cms[0]
  const matrixClient = Matrix.getMatrixClient()
  const isMounted = useRef(true)
  const [content, setContent] = useState('')
  const { t } = useTranslation('date')

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
      if (json.template === 'ul' || json.template === 'ol') {
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
      } else if (json.template === 'code') {
        const save = await matrixClient.sendMessage(roomId, {
          body: content,
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: '<pre><code>' + content + '</code></pre>'
        })
        if ('event_id' in save) {
          setSaved('Saved!')
          setTimeout(() => {
            setSaved()
          }, 1000)
        }
      } else if (json.template === 'quote') {
        const save = await matrixClient.sendMessage(roomId, {
          body: localStorage.getItem(roomId),
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: '<blockquote>' + localStorage.getItem(roomId) + '</blockquote>'
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
          formatted_body: '<h2>' + text + '</h2>'
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

  const onDelete = async (roomId, name, index) => {
    setReadOnly(true)
    try {
      deleteContentBlock(name, roomId, index)
      blocks.filter(room => room.name.charAt(0) !== 'x').forEach(async (block, i) => {
        if (i > index) {
          await reorder(block.name, block.room_id, projectSpace, true)
        }
      })
      let order = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.order').catch(console.log)
      order = order.order
      const indexOfRoom = order.indexOf(roomId)
      order.splice(indexOfRoom, 1)
      await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.order', { order: order })
      reloadSpace()
    } catch (err) {
      console.error(err)
    } finally {
      setReadOnly(false)
    }
  }

  const changeOrder = async (roomId, name, direction) => {
    setLoading(true)
    setReadOnly(true)

    const active = name.split('_')
    const orderOld = parseInt(active[0])
    const newOrder = orderOld + direction
    const passive = blocks[newOrder].name.split('_')
    const passiveRoom = blocks[newOrder].room_id

    let order = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.order').catch(console.log)
    order = order.order
    const indexOfRoom = order.indexOf(roomId)
    order.splice(indexOfRoom, 1) // remove from old position
    order.splice(indexOfRoom + direction, 0, roomId) // insert at new one @TODO sth wrong here!
    await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.order', { order: order })

    try {
      await matrixClient.setRoomName(roomId, newOrder + '_' + active[1])
        .then(await matrixClient.setRoomName(passiveRoom, orderOld + '_' + passive[1]))
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
      {/* preview
        ? <DisplayPreview content={block} matrixClient={matrixClient} contentLoaded={cms} />
        :
        */
        <>
          {index === 0 && !mapComponent && <AddContent number={index} projectSpace={projectSpace} blocks={blocks} reloadSpace={reloadSpace} contentType={contentType} />}
          <div className="editor">
            <div className="left">
              <LoadingSpinnerButton key={'up_' + block.room_id} disabled={index < 1 || mapComponent} onClick={() => changeOrder(block.room_id, block.name, -1)}>↑</LoadingSpinnerButton>
              <figure className="icon-bg">
                {
                  json.template === 'heading'
                    ? <HeadingIcon fill="var(--color-fg)" />
                    : json.template === 'audio'
                      ? <AudioIcon fill="var(--color-fg)" />
                      : json.template === 'image'
                        ? <ImageIcon fill="var(--color-fg)" />
                        : json.template === 'ul'
                          ? <UlIcon fill="var(--color-fg)" />
                          : json.template === 'ol'
                            ? <OlIcon fill="var(--color-fg)" />
                            : json.template === 'quote'
                              ? <QuoteIcon fill="var(--color-fg)" />
                              : json.template === 'code'
                                ? <CodeIcon fill="var(--color-fg)" />
                                : json.template === 'video'
                                  ? <VideoIcon fill="var(--color-fg)" />
                                  : json.template === 'playlist'
                                    ? <PlaylistIcon fill="var(--color-fg)" />
                                    : json.template === 'location'
                                      ? <LocationIcon fill="var(--color-fg)" />
                                      : json.template === 'date'
                                        ? <DateIcon fill="var(--color-fg)" />
                                        : json.template === 'bbb'
                                          ? <PictureInPictureIcon fill="var(--color-fg)" />
                                          : <TextIcon fill="var(--color-fg)" />
                }
              </figure>
              <LoadingSpinnerButton key={'down_' + block.room_id} disabled={index === blocks.length - 1 || mapComponent} onClick={() => changeOrder(block.room_id, block.name, 1)}>↓</LoadingSpinnerButton>
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
                    <option value="rs-inc">In Copyright</option>
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
                      <option value="rs-inc">In Copyright</option>
                    </select>
                    <TextareaAutosize rows={cms.info.alt.split('\n').length} value={cms.info.alt} disabled />
                  </div>
                  )
                : json.template === 'ul'
                  ? <List onSave={() => onSave(block.room_id)} storage={(list) => localStorage.setItem(block.room_id, list)} populated={cms?.body} type="ul" />
                  : json.template === 'ol'
                    ? <List onSave={() => onSave(block.room_id)} storage={(list) => localStorage.setItem(block.room_id, list)} populated={cms?.body} type="ol" />
                    : json.template === 'code'
                      ? <div className="center code">
                        <TextareaAutosize
                          value={content}
                          onChange={(e) => {
                            setContent(e.target.value)
                          }}
                          onBlur={(e) => {
                            if (content !== cms?.body) {
                              onSave(block.room_id, content)
                            }
                          }}
                        />
                      </div>
                      : (json.template === 'video' || json.template === 'livestream' || json.template === 'playlist')
                          ? (
                            <iframe
                              src={`https://stream.udk-berlin.de/${(json.template === 'playlist' ? 'video-playlists' : 'videos')}/embed/${cms?.body}`}
                              frameBorder="0"
                              title={cms?.body}
                              sandbox="allow-same-origin allow-scripts"
                              allowFullScreen="allowfullscreen"
                              style={{ width: '100%', aspectRatio: '16 / 9', border: 'calc(var(--margin) * 0.2) solid var(--color-fg)' }}
                            />
                            )
                          : json.template === 'location'
                            ? (
                              <div
                                className={cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-')) === '0.0, 0.0' ? 'center' : null}
                              >
                                {
                                cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-')) !== '0.0, 0.0' &&
                                  <MapContainer className={mapComponent ? 'center' : 'center warning'} center={[cms.body.substring(0, cms.body.indexOf(',')), cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-'))]} zoom={17} scrollWheelZoom={false} placeholder>
                                    <TileLayer
                                      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker
                                      position={[cms.body.substring(0, cms.body.indexOf(',')), cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-'))]}
                                      icon={(new Icon.Default({ imagePath: '/leaflet/' }))}
                                    >
                                      <Popup>
                                        {locations.find(coord => coord.coordinates === cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.lastIndexOf('-')))?.name || // if the location is not in our location.json
                                        cms.body.substring(cms.body.lastIndexOf('-') + 1).length > 0 // we check if the custom input field was filled in
                                          ? cms.body.substring(cms.body.lastIndexOf('-') + 1) // if true, we display that text on the popup otherwise we show the lat and long coordinates
                                          : cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1)}
                                      </Popup>
                                    </Marker>
                                  </MapContainer>
                              }
                                {cms.body.substring(cms.body.lastIndexOf('-') + 1).length > 0 && <input type="text" value={cms.body.substring(cms.body.lastIndexOf('-') + 1)} disabled />}
                                {!mapComponent &&
                                  <p>❗️
                                    <Trans t={t} i18nkey="moveMap">Please add Venue and time with the new <a href="#date">Date and Venue</a> function.
                                      You can delete this element afterwards.
                                    </Trans>
                                  </p>}
                              </div>
                              )
                            : json.template === 'date'
                              ? <div className={mapComponent ? 'center' : 'center warning'}>
                                {cms.body.split(' ')[0] && <input type="date" value={cms.body.split(' ')[0]} disabled required />}
                                {cms.body.split(' ')[1] && <input type="time" value={cms.body.split(' ')[1]} disabled required />}
                                {!mapComponent &&
                                  <p>❗️
                                    <Trans t={t} i18nkey="moveMap">Please add Venue and time with the new <a href="#date">Date and Venue</a> function.
                                      You can delete this element afterwards.
                                    </Trans>
                                  </p>}
                              </div>
                              : json.template === 'bbb'
                                ? <DisplayBbb cms={cms} />
                                : (json.template === 'video' || json.template === 'livestream' || json.template === 'playlist')
                                    ? (
                                      <iframe
                                        src={`https://stream.udk-berlin.de/${(json.template === 'playlist' ? 'video-playlists' : 'videos')}/embed/${cms?.body}`}
                                        frameBorder="0"
                                        title={cms?.body}
                                        sandbox="allow-same-origin allow-scripts"
                                        allowFullScreen="allowfullscreen"
                                        style={{ width: '100%', aspectRatio: '16 / 9', border: 'calc(var(--margin) * 0.2) solid var(--color-fg)' }}
                                      />
                                      )
                                    : json.template === 'heading'
                                      ? <div className="center">
                                        <TextareaAutosize
                                          minRows={6}
                                          value={content}
                                          onChange={(e) => {
                                            setContent(e.target.value)
                                          }}
                                          onBlur={(e) => {
                                            if (content !== cms?.body) {
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
                                          placeholder={json.template}
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
              <DeleteButton
                onDelete={() => onDelete(block.room_id, block.name, index)} callback={reloadSpace}
              />
            </div>
          </div>
          {!mapComponent && <AddContent number={index + 1} projectSpace={projectSpace} blocks={blocks} reloadSpace={reloadSpace} contentType={contentType} />}

        </>
      }
    </>
  )
}
export default DisplayContent
