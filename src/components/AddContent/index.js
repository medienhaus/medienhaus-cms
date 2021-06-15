import React, { useState } from 'react'
import Matrix from '../../Matrix'
import FetchCms from '../../components/matrix_fetch_cms'
import Editor, {renderToHtml} from "rich-markdown-editor";
import debounce from "lodash/debounce";
import { Loading } from '../../components/loading'

import textIcon from '../../assets/icons/remix/text.svg'
import headingIcon from '../../assets/icons/remix/h-1.svg'
import audioIcon from '../../assets/icons/remix/volume-up-line.svg'
import imageIcon from '../../assets/icons/remix/image-line.svg'

  const AddContent = ({block, index, blocks}) => {
    const [clicked, setClicked] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [saved, setSaved] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { cms, error, fetching } = FetchCms(block.room_id)
    const json = JSON.parse(block.topic)
    const matrixClient = Matrix.getMatrixClient()
    
    const onSave = async (roomId) => {
      setReadOnly(true);
      try {
       const save =  await matrixClient.sendMessage(roomId, {
          body: localStorage.getItem(roomId),
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: renderToHtml(localStorage.getItem(roomId))
        })
        if ("event_id" in save) {
          setSaved("Saved!")
          setTimeout(() => {
            setSaved()
          },1000)
        }
        // await matrixClient.redactEvent(roomId.room_id, entry.event, null, { 'reason': 'I have my reasons!' })
      } catch (e) {
        console.error('error while trying to save: ' + e)
        setSaved("Couldn't save!")
          setTimeout(() => {
            setSaved()
          },1000)
      } finally {
        setReadOnly(false)
      }
    }

    const onDelete = async (e, roomId, index) => {
      e.preventDefault()
      setDeleting(true)
      setReadOnly(true)

      const reorder = (name, room_id) => {
            const title = name.split('_')
            const num = parseInt(title[0]) - 1
            matrixClient.setRoomName(room_id, num  + '_' + title[1] )
          }
      try {
        const count = await matrixClient.getJoinedRoomMembers(roomId)
        Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
          localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(roomId, name)
        })
        matrixClient.leave(roomId)
        blocks.forEach((block, i) => {
          if (i > index) {
            reorder(block.name, block.room_id)
          }
        })
        //setCounter(0)
      } catch (err) {
        console.error(err)
        setDeleting(`couldn't delete ${json.type}, please try again or try reloading the page`)
        setTimeout(() => {
          setDeleting()
        },2000)
      }
      finally {
        setDeleting()
      }
      //matrixClient.kick(roomId, userId)
      //matrixClient.leave(roomId)
    }

    const changeOrder = async (e,roomId, name, direction) => {
      e.preventDefault()
      setReadOnly(true)
      //blocks.splice((pos) + direction, 0, blocks.splice(pos, 1).pop())
      const active = name.split('_')
      const order = parseInt(active[0])
      const newOrder = order + direction
      const passive = blocks[newOrder].name.split('_')
      const passiveRoom = blocks[newOrder].room_id
      try {
        await matrixClient.setRoomName(roomId, newOrder + '_' + active[1]).then(
          await matrixClient.setRoomName(passiveRoom, order + '_' + passive[1])
        )//.then(setCounter(0))
      } catch (err) {
        console.error(err);
      } finally {
        setReadOnly(false)
      }
    }
      
  const string2hash = (string) => {
    console.log(typeof string);
    var hash = 0;
                if (string.length === 0) return hash;
                for (let i = 0; i < string.length; i++) {
                    const char = string.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return hash;
    }
      
        return (
          fetching
            ? <div style={{ height: "120px"}}><Loading /></div> // @Andi sort of... hack to keep interface from violently redrawing. We need to see how we deal with this. Too many waterfalls, let's stick to the rivers and the lakes that we're used to.
            : error
              ? console.error(error)
              : (
                /*
                @Andi 
                This needs a lot of css work...
                I added some flexbox stuff quickly inline as well as in index.css to get the basic idea done. 
                Basic structure for each element should now be:
                <div>
                  <div class="button-group">
                  <button>up</button>
                  <section><img icon /></section> section hack to have a white background quickly
                  <button>down</button>
                  </div>
                  <Editor /> or <image /> <audio /> etc...
                  <button>delete</button>
                </div>
                */
                <div class="editor-group" style={{display: "flex"}}>
                  <div class="button-group">
                
                    <button style={{ padding: "calc(var(--margin) * 0.01)" }} key={'up_' + block.room_id} disabled={ index === 0 } onClick={(e) => changeOrder(e, block.room_id,  block.name, -1)}>↑</button>
                    <section id="icon-bg" style={{ background: "white" }}><img src={json.type === 'heading' ? headingIcon : json.type === 'audio' ? audioIcon : json.type === 'image' ? imageIcon : textIcon} alt="svg icon text" /></section>
                    <button style={{ padding: "calc(var(--margin) * 0.01)" }} key={'down_' + block.room_id} disabled={ index === blocks.length -1 } onClick={(e) => changeOrder(e,block.room_id, block.name, 1)}>↓</button>
                  </div>
                  {cms?.msgtype === 'm.image' ?
                    //@Andi please fix widht in css 
                      <img src={matrixClient.mxcUrlToHttp(cms.url)} alt={cms.info.name} key={block.room_id} width="100%"/>
                    : cms?.msgtype === 'm.audio' ?
                      <>
                    <audio controls>
                    <source src={matrixClient.mxcUrlToHttp(cms.url)} />
                    </audio>
                    <section id="audio-title">{cms.body}</section>
                    </>  :
                    <div  style={{width:"100%"}}>
                        <Editor
                      dark={window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches}
                      defaultValue={cms?.body}
                      disableExtensions={['blockmenu', 'image', 'embed', 'table', 'tr', 'th', 'td', 'bullet_list', 'ordered_list', 'checkbox_item', 'checkbox_list', 'container_notice', 'blockquote', 'heading', 'hr', 'highlight']}
                      placeholder={json.type}
                          readOnly={readOnly}
                          onSave={({ done }) => { if (localStorage.getItem(block.room_id) !== null && cms !== undefined && string2hash(cms.body) !== string2hash(localStorage.getItem(block.room_id))) {
                            onSave(block.room_id)
                            localStorage.removeItem(block.room_id)
                          } else if(localStorage.getItem(block.room_id) !== null && cms === undefined){
                            onSave(block.room_id)
                            localStorage.removeItem(block.room_id)
                          } }}
                      onChange={debounce((value) => {
                        const text = value();
                        localStorage.setItem(block.room_id, text);
                       }, 250)}
                      handleDOMEvents={{
                        focus: () => console.log("FOCUS on " + block.room_id),
                        blur: (e) => {
                          if (localStorage.getItem(block.room_id) !== null && cms !== undefined && string2hash(cms.body) !== string2hash(localStorage.getItem(block.room_id))) {
                            onSave(block.room_id)
                            localStorage.removeItem(block.room_id)
                          } else if(localStorage.getItem(block.room_id) !== null && cms === undefined){
                            onSave(block.room_id)
                            localStorage.removeItem(block.room_id)
                          }
                        }
                      }
                      }
                      key={block.room_id} />
                        <p key={block.room_id + "_p"} style={{ fontSize: "calc(var(--margin) * 0.7" }}>{saved}</p> {//feedback that saving was succesfull or has failed
                        }
                    </div>
                
                  }
                  {<button style={{ padding: "calc(var(--margin) * 0.01)", width: "5%" }} key={'delete' + index} onClick={(e) => {
                      if (clicked) {
                        onDelete(e, block.room_id, index)
                        setClicked(false)
                      } else {
                        e.preventDefault()
                        setClicked(true)
                      }
                      <p>{deleting}</p> //feedback that saving was succesfull or has failed
                    }} >{clicked ? 'SURE?' : deleting ? <Loading /> : 'x'}</button>}
            </div>
                )
        )
  }
  export default AddContent