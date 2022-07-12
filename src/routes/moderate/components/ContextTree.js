import React, { useState, useEffect } from 'react'
import { Loading } from '../../../components/loading'
import Matrix from '../../../Matrix'
import styled from 'styled-components'
import { createStructurObject } from '../../../components/matrix_create_structure'
import mapDeep from 'deepdash/mapDeep'
import filterDeep from 'deepdash/filterDeep'
import config from '../../../config.json'
import { fetchTree } from '../../../helpers/MedienhausApiHelper'
import UnstyledButton from '../../../components/medienhausUI/unstyledButton'

const Container = styled.ul`
    margin-left: var(--margin);
    list-style-type: none;
`

const ListElement = styled.li`
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

span:before {
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
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}
  `

const ContextTree = ({ moderationRooms, contextId, onContextChange }) => {
  const [loading, setLoading] = useState(false)
  const [contexts, setContexts] = useState()
  const [rootContext, setRootContext] = useState()
  const [error, setError] = useState('')
  const [showItems, setShowItems] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    let cancelled = false

    const getHierarchyFromMatrix = async () => {
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
    }

    const getHierarchyFromApi = async () => {
      const tree = await fetchTree(rootContext).catch(() => {
        getHierarchyFromMatrix()
      })
      setContexts(tree)
    }

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
  }, [rootContext, matrixClient, showItems])

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

  if (!contexts || !rootContext || loading) return <Loading />
  return (
    <>
      {error && <p>{error}</p>}
      <SwitchContainter>
        <span>Show items</span>
        <Switch>
          <input type="checkbox" onChange={() => setShowItems(prevState => !prevState)} />
          <span className="slider" />
        </Switch>
      </SwitchContainter>
      <Container>
        {mapDeep(filterDeep(contexts, (value, key, parent, context) => {
          if (context.depth > (config.medienhaus.sites.moderate.manageContexts.treeDepth || 1)) return
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
          <ListElement key={value.id + key} disabled={!!moderationRooms[value.id]}>
            {' ─ '.repeat(context.depth)}
            {moderationRooms[value.id] ? <UnstyledButton onClick={handleContextClick} value={value.id}>{value.name}</UnstyledButton> : value.name}
            {value.type === 'item' && <span style={{ color: 'gray' }}> {config.medienhaus.item[value.template]?.label.toUpperCase() || 'ITEM'}</span>}
          </ListElement>
        ), { childrenPath: 'children', includeRoot: false, rootIsChildren: true })}
      </Container>
    </>
  )
}
export default ContextTree
