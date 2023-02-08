import React, { useState, useEffect, useCallback } from 'react'
import { Loading } from '../../../components/loading'
import Matrix from '../../../Matrix'
import styled from 'styled-components'
import { createStructurObject } from '../../../components/matrix_create_structure'
import mapDeep from 'deepdash/mapDeep'
import filterDeep from 'deepdash/filterDeep'
import config from '../../../config.json'
import { fetchTree } from '../../../helpers/MedienhausApiHelper'
import UnstyledButton from '../../../components/medienhausUI/unstyledButton'
import { useTranslation } from 'react-i18next'
import DeleteButton from '../../create/components/DeleteButton'

const Container = styled.ul`
    margin-left: var(--margin);
    list-style-type: none;
    display: grid;
    grid-auto-flow: row;
    grid-gap: calc(var(--margin) * 0.3);
`

const ListElement = styled.li`
    display: flex;
    justify-content: space-between;
    color: ${props => !props.disabled && 'gray'};
`

const SwitchContainter = styled.div`
  display: flex;
  justify-content: space-between;
`

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: gray;
    -webkit-transition: .4s;
    transition: .4s;
  }

  span::before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: var(--color-bg);
    -webkit-transition: .4s;
    transition: .4s;
  }

  input:checked + span {
    background-color: var(--color-fg);
  }

  input:checked + span:before {
    -webkit-transform: translateX(26px);
    transform: translateX(26px);
  }
`

const ContextTree = ({ moderationRooms, contextId, onContextChange, onDelete }) => {
  const { t } = useTranslation('moderate')
  const [loading, setLoading] = useState(false)
  const [contexts, setContexts] = useState()
  const [rootContext, setRootContext] = useState()
  const [error, setError] = useState('')
  const [showItems, setShowItems] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState('')
  const matrixClient = Matrix.getMatrixClient()

  const getHierarchyFromMatrix = useCallback(async () => {
    setLoading(true)
    //   const tree = await matrixClient.getRoomHierarchy(rootContext, null, config.medienhaus.sites.moderate.manageContexts.treeDepth).catch(err => {
    //     console.debug(err)
    //     setError('Couldn"t create tree')
    //   })
    const filteredTree = await createStructurObject(rootContext).catch(err => {
      console.debug(err)
      setError('Couldn"t create tree')
    })
    setContexts(filteredTree)
    setLoading(false)
  }, [rootContext])

  const getHierarchyFromApi = useCallback(async () => {
    const tree = await fetchTree(rootContext).catch(() => {
      getHierarchyFromMatrix()
    })
    setContexts(tree)
  }, [getHierarchyFromMatrix, rootContext])

  useEffect(() => {
    let cancelled = false

    if (!cancelled && rootContext) {
      if (config.medienhaus.api) {
        getHierarchyFromApi()
      } else {
        getHierarchyFromMatrix()
      }
    }
    return () => {
      cancelled = true
    }
  }, [rootContext, matrixClient, showItems, getHierarchyFromApi, getHierarchyFromMatrix])

  useEffect(() => {
    let cancelled = false

    if (!cancelled) {
      setRootContext(contextId)
    }
    return () => {
      cancelled = true
    }
  }, [contextId])

  const handleContextClick = (e) => {
    onContextChange(e.target.value)
  }

  const handleDelete = async (roomId) => {
    const removeSpaceChild = await onDelete(roomId)
    if (removeSpaceChild.event_id) {
      setContexts(prevState => {
        const _contexts = { ...prevState }
        delete _contexts[contextId].children[roomId]
        return _contexts
      })
    }
  }

  if (!contexts || !rootContext || loading) return <Loading />
  return (
    <>
      {error && <p>{error}</p>}
      <SwitchContainter>
        <span>{t('Show items')}</span>
        <Switch>
          <input type="checkbox" checked={showItems} onChange={() => setShowItems(prevState => !prevState)} />
          <span className="slider" />
        </Switch>
      </SwitchContainter>
      <Container>
        {mapDeep(filterDeep(contexts, (value, key, parent, context) => {
          if (context.depth > (config.medienhaus.sites.moderate.manageContexts.treeDepth || 2)) return
          // Exclude all hierarchy elements that are not "contexts"
          if (value?.type.includes('content')) return false
          if (!showItems && value?.type.includes('item')) return false
          if (config.medienhaus.languages.includes(value?.name)) return false

          value.path = []
          value.pathIds = []
          function addParentToPath (item) {
            if (item.parentItem.value.name) {
              value.path.unshift(item.parentItem.value.name)
              value.pathIds.unshift(item.parentItem.value.id)
              // Recursion: If this parent has yet another parent item, go check that out
              if (item.parentItem.parentItem) {
                addParentToPath(item.parentItem)
              }
            }
          }
          addParentToPath(context._item)
          //   if (!config.medienhaus?.sites?.moderate?.manageContexts?.showRoot) {
          //     value.path.unshift(struktur[Object.keys(struktur)[0]].name)
          //     value.pathIds.unshift(struktur[Object.keys(struktur)[0]].id)
          //   }
          return true
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true }), (value, key, parent, context) => (
          <>
            <ListElement
              onClick={() => setHighlightedElement(prevState => prevState === value.room_id ? '' : value.room_id)}
              active={highlightedElement === value.room_id}
              key={value.id + key + parent.id}
              disabled={!!moderationRooms[value.id]}
            >
              <span>
                {' --- '.repeat(context.depth)}
                {moderationRooms[value.id] ? <UnstyledButton onClick={handleContextClick} value={value.id}>{value.name}</UnstyledButton> : value.name}
                {value.type === 'item' && <span style={{ color: 'gray' }}> {config.medienhaus.item[value.template]?.label.toUpperCase() || 'ITEM'}</span>}
              </span>
              <DeleteButton width="calc(var(--margin)*2)" height="calc(var(--margin)*2)" disabled={context.depth !== 2} onDelete={() => handleDelete(value.id)} />
            </ListElement>

          </>

        ), { childrenPath: 'children', includeRoot: false, rootIsChildren: true })}
      </Container>
    </>
  )
}
export default ContextTree
