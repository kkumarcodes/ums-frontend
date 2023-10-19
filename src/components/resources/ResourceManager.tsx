// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { RightOutlined } from '@ant-design/icons'
import { Badge, Menu, Skeleton } from 'antd'
import { getFullName } from 'components/administrator'
import WisernetSection from 'components/common/UI/WisernetSection'
import { map, zipObject } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  selectResourceGroupsObject,
  selectResources,
  selectResourcesForStudent,
} from 'store/resource/resourcesSelectors'
import { fetchResources } from 'store/resource/resourcesThunks'
import { Resource } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsStudentOrParent, selectStudent } from 'store/user/usersSelector'
import { addStudent } from 'store/user/usersSlice'
import ResourceManagerResourcesTable from './ResourceManagerResourcesTable'
import styles from './styles/ResourceManager.scss'

type Props = {
  studentID?: number
  counselorID?: number
}

const UNCATEGORIZED_RESOURCE_GROUP = 'uncategorized'

const ResourceManager = ({ studentID, counselorID }: Props) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const student = useSelector(selectStudent(studentID))
  const isStudentOrParent = useSelector(selectIsStudentOrParent)
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<number | null>(null)

  // Resources and groups available to the user we're managing resources for
  // We don't pull these from the store because they're ultimately determined by the backend
  const [studentResources, setStudentResources] = useState<Resource[]>([])

  // Always fetch resources for student
  useEffect(() => {
    if (studentID) {
      setLoading(true)
      dispatch(fetchResources({ student: studentID })).then(resources => {
        setStudentResources(resources)
        setLoading(false)
      })
    }
  }, [dispatch, studentID])

  // All resources and groups available to the logged in user. Superset of userResources/Groups
  const allResources = useSelector(selectResources)
  const allResourceGroups = useSelector(selectResourceGroupsObject)

  let resources = allResources
  // We need to add to our local studentResources any resources on student from store in case counselor adds new resources
  if (student) {
    const studentResourcePKs = new Set([...map(studentResources, 'pk'), ...student.visible_resources])
    resources = allResources.filter(r => studentResourcePKs.has(r.pk))
  }

  const resourcesWithGroups = resources.filter(r => r && r.resource_group)

  // If we're manging resources for a student, then we only display resource groups with resources visible to that
  // student. Otherwise (counselor/admin managing resources) we show al resource groups
  const allResourceGroupsObject = studentID
    ? zipObject(map(resourcesWithGroups, 'resource_group'), map(resourcesWithGroups, 'resource_group_title'))
    : allResourceGroups
  const uncategorizedResourceCount = resources.filter(r => !r.resource_group).length

  const resourceGroupMenuItems = map(allResourceGroupsObject, (name, pk) => (
    <Menu.Item key={pk}>
      {name}&nbsp;
      <Badge showZero count={resourcesWithGroups.filter(r => r.resource_group === Number(pk)).length} />
      {selectedResourceGroup === Number(pk) && <RightOutlined />}
    </Menu.Item>
  ))

  let helpText =
    'Below is all of the content made available by Collegewise or your counselor. Click "Open Resource" to view a content item.'
  if (counselorID)
    helpText += ' You can add resources for an individual student on the Notes and Files tab for the student.'
  else if (!isStudentOrParent && student) {
    helpText = `Content is automatically made available to a student when a roadmap is applied. Use the section below to view and edit the specific content items that are available to ${getFullName(
      student,
    )}. Resources are shared between students, and students cannot create resources.`
  }

  return (
    <WisernetSection title="Resources" noPadding>
      <p className="help">{helpText}</p>
      <div className={styles.resourceManager}>
        <div className="resource-groups-container">
          <p className="f-subtitle-2">Categories</p>
          <Menu onSelect={p => setSelectedResourceGroup(p.key === UNCATEGORIZED_RESOURCE_GROUP ? null : Number(p.key))}>
            {uncategorizedResourceCount > 0 && (
              <Menu.Item
                className={selectedResourceGroup === null ? 'ant-menu-item-selected' : ''}
                key={UNCATEGORIZED_RESOURCE_GROUP}
              >
                Uncategorized <Badge showZero count={uncategorizedResourceCount} />
                {selectedResourceGroup === null && <RightOutlined />}
              </Menu.Item>
            )}
            {resourceGroupMenuItems}
          </Menu>
        </div>
        <div className="resources-container">
          {loading && <Skeleton loading />}
          {!loading && (
            <ResourceManagerResourcesTable
              studentID={studentID}
              counselorID={counselorID}
              resourceGroupID={selectedResourceGroup}
              resources={resources.filter(r => r.resource_group === selectedResourceGroup)}
            />
          )}
        </div>
      </div>
    </WisernetSection>
  )
}
export default ResourceManager
