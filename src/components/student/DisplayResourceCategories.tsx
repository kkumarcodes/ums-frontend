// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { RootState } from 'store/rootReducer'

const DisplayResourceList = () => {
  const { resourceKeys } = useSelector((state: RootState) => {
    const { resources } = state.resource
    const resourceKeys = {}

    Object.values(resources)
      .filter(r => !r.cap)
      .forEach(row => {
        const title = row.resource_group_title
        const id = row.resource_group
        if (title) {
          resourceKeys[id] = title
        }
      })

    return {
      resourceKeys: Object.entries(resourceKeys),
    }
  }, shallowEqual)

  return (
    <>
      {resourceKeys.map(res => {
        const id = res[0]
        const resourceName = res[1]
        const url = `/resource/${id}`
        return (
          <NavLink to={url} key={id}>
            {resourceName}
          </NavLink>
        )
      })}
    </>
  )
}

export default DisplayResourceList
