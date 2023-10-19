import { createSelector } from '@reduxjs/toolkit'
import { values } from 'lodash'
import { RootState } from 'store/rootReducer'
import { getStudents } from 'store/user/usersSelector'

export const getResources = (state: RootState) => state.resource.resources
export const getResourceGroups = (state: RootState) => state.resource.resourceGroups

export const selectResources = createSelector(getResources, resources => values(resources))
export const selectResourceGroups = createSelector(getResourceGroups, resourceGroups => values(resourceGroups))
export const selectResourceGroupsObject = createSelector(getResourceGroups, r => r)

export const selectResource = (pk?: number) => createSelector(getResources, r => (pk ? r[pk] : undefined))

// Will not return undefined resources (i.e. resources visible to student but not in our store)
export const selectResourcesForStudent = (pk?: number) =>
  createSelector([getResources, getStudents], (resources, students) =>
    pk && students[pk] ? (students[pk].visible_resources ?? []).map(r => resources[r]).filter(r => r) : [],
  )

// Returns resources for student that are also in a specified resource group or uncategorized (null)
export const selectResourcesInGroupForStudent = (studentPK?: number, resourceGroup?: number | null) =>
  createSelector(selectResourcesForStudent(studentPK), resources =>
    typeof resourceGroup === 'undefined' ? [] : resources.filter(r => r.resource_group === resourceGroup),
  )

// Returns resources that are also in a specified resource group or uncategorized (null)
export const selectAllResourcesInGroup = (resourceGroup?: number | null) =>
  createSelector(getResources, resources =>
    typeof resourceGroup === 'undefined' ? [] : values(resources).filter(r => r.resource_group === resourceGroup),
  )

export const selectResourceGroupsForStudent = (pk?: number) =>
  createSelector([getResourceGroups, getStudents], (resources, students) =>
    pk && students[pk] ? (students[pk].visible_resource_groups ?? []).map(r => resources[r]) : [],
  )
