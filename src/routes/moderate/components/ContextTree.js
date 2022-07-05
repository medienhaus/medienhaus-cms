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

const ContextTree = ({ showItems, moderationRooms, contextId, onContextChange }) => {
  const [loading, setLoading] = useState(false)
  const [contexts, setContexts] = useState()
  const [rootContext, setRootContext] = useState()
  const [error, setError] = useState('')
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
      console.log(tree)
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
      <Container>
        {mapDeep(filterDeep(contexts, (value, key, parent, context) => {
          if (context.depth > (config.medienhaus.sites.moderate.manageContexts.treeDepth || 1)) return
          // Exclude all hierarchy elements that are not "contexts"
          if (value?.type.includes('content')) return false
          if (!config.medienhaus.sites.moderate.manageContexts.showItemsInTree && value?.type.includes('item')) return false
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
            {' --- '.repeat(context.depth)}
            {moderationRooms[value.id] ? <UnstyledButton onClick={handleContextClick} value={value.id}>{value.name}</UnstyledButton> : value.name}
            {value.type === 'item' && <span style={{ color: 'gray' }}> {config.medienhaus.item[value.template]?.label.toUpperCase() || 'ITEM'}</span>}
          </ListElement>
        ), { childrenPath: 'children', includeRoot: false, rootIsChildren: true })}

      </Container>
    </>
  )
}
export default ContextTree
