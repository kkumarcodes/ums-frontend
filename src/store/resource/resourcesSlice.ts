import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { map, zipObject } from 'lodash'
import { Resource, ResourceGroup, ResourceState } from './resourcesTypes'

const initialState: ResourceState = {
  resources: {},
  resourceGroups: {},
}

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    addResourceGroup(state, action: PayloadAction<ResourceGroup>) {
      state.resourceGroups[action.payload.pk] = action.payload
    },
    addResourceGroups(state, action: PayloadAction<Array<ResourceGroup>>) {
      state.resourceGroups = { ...state.resourceGroups, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    removeResourceGroup(state, action: PayloadAction<{ pk: number }>) {
      delete state.resourceGroups[action.payload.pk]
    },
    addResource(state, action: PayloadAction<Resource>) {
      state.resources[action.payload.pk] = action.payload
    },
    addResources(state, action: PayloadAction<Array<Resource>>) {
      state.resources = { ...state.resources, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    removeResource(state, action: PayloadAction<{ pk: number }>) {
      delete state.resources[action.payload.pk]
    },
  },
})

export const {
  addResourceGroup,
  addResourceGroups,
  removeResourceGroup,
  addResource,
  addResources,
  removeResource,
} = resourcesSlice.actions

export default resourcesSlice.reducer
