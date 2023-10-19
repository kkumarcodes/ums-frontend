// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import API from 'store/api'
import errorHandler from 'store/errorHandler'
import {
  addResource,
  addResourceGroup,
  addResourceGroups,
  addResources,
  removeResource,
  removeResourceGroup,
} from './resourcesSlice'
import { PostResource, Resource, ResourceGroup } from './resourcesTypes'

const RESOURCE_GROUP_ENDPOINT = (pk?: number | string) =>
  pk ? `/resource/resource-groups/${pk}/` : `/resource/resource-groups/`
const RESOURCE_ENDPOINT = (pk?: number | string) => (pk ? `/resource/resources/${pk}/` : `/resource/resources/`)

/**
 * Fetch a single resource group, identified by @param pk
 */
export const fetchResourceGroup = (pk: number | string) => async (dispatch: Dispatch) => {
  try {
    const response = await API.get(RESOURCE_GROUP_ENDPOINT(pk))
    return dispatch(addResourceGroup(response.data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch all resource groups who meet filter criteria
 */

export const fetchResourceGroups = () => async (dispatch: Dispatch) => {
  try {
    const response = await API.get(RESOURCE_GROUP_ENDPOINT())
    return dispatch(addResourceGroups(response.data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Create a resource group with @param newResourceGroup
 */
export const createResourceGroup = (newResourceGroup: Partial<ResourceGroup>) => async (dispatch: Dispatch) => {
  try {
    const response = await API.post(RESOURCE_GROUP_ENDPOINT(), newResourceGroup)
    return dispatch(addResourceGroup(response.data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Update a resource group, identified by @param pk with @param editResourceGroup
 */
export const updateResourceGroup = (pk: number | string, editResourceGroup: Partial<ResourceGroup>) => async (
  dispatch: Dispatch,
) => {
  try {
    const response = await API.patch(RESOURCE_GROUP_ENDPOINT(pk), editResourceGroup)
    return dispatch(addResourceGroup(response.data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Delete a resource group, identified by @param pk
 */
// export const deleteResourceGroup = (pk: number | string) => async (dispatch: Dispatch) => {
//   try {
//     const response = await API.delete(RESOURCE_GROUP_ENDPOINT(pk))
//     dispatch(removeResourceGroup(response.data))

export const deleteResourceGroup = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.delete(RESOURCE_GROUP_ENDPOINT(pk))
    return dispatch(removeResourceGroup({ pk }))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch a single resource, identified by @param pk
 */
export const fetchResource = (pk: number | string) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Resource } = await API.get(RESOURCE_ENDPOINT(pk))
    return dispatch(addResource(data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch all resources who meet filter criteria
 * @param filter { FetchResourceFilter } Passed directly as query params to endpoint
 */
type FetchResourceFilter = {
  student?: number
}
export const fetchResources = (filter: FetchResourceFilter) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Resource[] } = await API.get(RESOURCE_ENDPOINT(), { params: filter })
    dispatch(addResources(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const createResource = (newResource: Partial<PostResource>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Resource } = await API.post(RESOURCE_ENDPOINT(), newResource)
    dispatch(addResource(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Update a resource , identified by @param pk with @param editResource
 */
export const updateResource = (pk: number | string, editResource: Partial<PostResource>) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data }: { data: Resource } = await API.patch(RESOURCE_ENDPOINT(pk), editResource)
    dispatch(addResource(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Delete a resource (actually sets archive=true on backend), identified by @param pk
 */
export const deleteResource = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.patch(RESOURCE_ENDPOINT(pk), { archived: true })
    return dispatch(removeResource({ pk }))
  } catch (err) {
    throw errorHandler(err)
  }
}
