// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
/**
 * This component to be used by tutor/counselor/admin (i.e. not a student or parent)
 * to manage the resources available to a student. Can toggle between viewing resources and resource groups,
 * Can create both
 */
import { Button, Radio, Select, Tooltip } from 'antd'
import Skeleton from 'antd/lib/skeleton'
import { handleError } from 'components/administrator/utils'
import StudentResourcesTable from 'components/resources/StudentResourcesTable'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { fetchResourceGroups, fetchResources } from 'store/resource/resourcesThunks'
import { Resource, ResourceGroup } from 'store/resource/resourcesTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { updateStudent } from 'store/user/usersThunks'
import styles from './styles/StudentResourceManager.scss'

const { Option } = Select
interface OwnProps {
  studentID: number
  entityTypes?: ('resources' | 'resourceGroups')[]
  defaultEntity?: 'resources' | 'resourceGroups'
  showCreate?: boolean
}

export const StudentResourceManager = ({
  studentID,
  entityTypes = ['resources', 'resourceGroups'],
  defaultEntity = 'resources',
  showCreate = true,
}: OwnProps) => {
  const dispatch = useReduxDispatch()
  const [entity, setEntity] = useState<'resources' | 'resourceGroups'>(defaultEntity)
  const [selectedEntities, setSelectedEntities] = useState<number[]>([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { resources, resourceGroups, fullResourceList, fullResourceGroupList, studentFirstName } = useSelector(
    (state: RootState) => {
      let resources: Array<Resource> = []
      let resourceGroups: Array<ResourceGroup> = []
      const fullResourceList = Object.values(state.resource.resources)
      const fullResourceGroupList = Object.values(state.resource.resourceGroups)

      resources = _.sortBy(
        Object.values(state.resource.resources).filter(ses => {
          return state.user.students[studentID].visible_resources.includes(ses.pk)
        }),
        'title',
      )

      resourceGroups = _.sortBy(
        Object.values(state.resource.resourceGroups).filter(ses => {
          return state.user.students[studentID].visible_resource_groups.includes(ses.pk)
        }),
        'title',
      )

      return {
        resources,
        resourceGroups,
        fullResourceList,
        fullResourceGroupList,
        studentFirstName: state.user.students[studentID].first_name,
      }
    },
  )

  const loadResourceGroups = resourceGroups.length === 0
  useEffect(() => {
    setLoading(true)
    const promises: Promise<any>[] = []
    if (loadResourceGroups) {
      promises.push(dispatch(fetchResourceGroups()))
    }
    promises.push(dispatch(fetchResources({ student: studentID })))
    Promise.all(promises).finally(() => {
      setLoading(false)
    })
  }, [studentID, dispatch, loadResourceGroups])

  const addNewItems = () => {
    setSaving(true)

    let editStudent
    if (entity === 'resources') {
      editStudent = { visible_resources: resources.map(r => r.pk).concat(selectedEntities) }
    } else {
      editStudent = { visible_resource_groups: resourceGroups.map(r => r.pk).concat(selectedEntities) }
    }
    dispatch(updateStudent(studentID, editStudent))
      .then(() => {
        setSelectedEntities([])
      })
      .catch(() => handleError('Update failed'))
      .finally(() => setSaving(false))
  }

  const renderMultiSelect = () => {
    const list: Array<Resource | ResourceGroup> =
      entity === 'resources'
        ? fullResourceList.filter(res => !resources.includes(res))
        : fullResourceGroupList.filter(res => !resourceGroups.includes(res))

    const phrasing = entity === 'resources' ? 'resources' : 'resource groups'
    const placeholderText = list.length > 0 ? `Select ${phrasing}...` : `No available options`
    if (!list) {
      return null
    }

    return (
      <div className="select-form">
        <label>{`Add new ${phrasing} for ${studentFirstName}`}</label>
        <br />
        <div className="flex">
          <div className="flex-select-container">
            <Select
              value={selectedEntities}
              onChange={setSelectedEntities}
              optionFilterProp="children"
              filterOption
              showSearch
              mode="multiple"
              placeholder={placeholderText}
            >
              {list.map((res: Resource | ResourceGroup) => {
                return (
                  <Option key={res.pk} value={res.pk}>
                    {res.title}
                  </Option>
                )
              })}
            </Select>
          </div>
          <Button type="primary" htmlType="submit" loading={saving} onClick={addNewItems}>
            Add to {studentFirstName}
          </Button>
        </div>
      </div>
    )
  }

  const showCreateResourceModal = () => {
    dispatch(showModal({ props: { type: entity, student: studentID }, modal: MODALS.CREATE_RESOURCE }))
  }

  // Toolbar has option for toggling between resources and resource groups, ability to add existing resources or
  // resource groups, and create new ones
  const renderToolbar = () => {
    return (
      <div className="resources-toolbar">
        <div className="toolbar-group flex">
          <Radio.Group
            className="entity-toggle"
            defaultValue="resources"
            buttonStyle="solid"
            onChange={e => setEntity(e.target.value)}
          >
            <Radio.Button value="resourceGroups">Resource Groups</Radio.Button>
            <Radio.Button value="resources">Resources</Radio.Button>
          </Radio.Group>
          {entity === 'resources' && showCreate && (
            <Tooltip title="After creating a new resource, you can make it available to this student below">
              <Button className="createButton” type=“primary" onClick={() => showCreateResourceModal()}>
                <PlusCircleOutlined />
                Create New Resource
              </Button>
            </Tooltip>
          )}
        </div>
        <div className="toolbar-group">{renderMultiSelect()}</div>
      </div>
    )
  }

  if (loading) return <Skeleton active />
  return (
    <div className={styles.studentResourceManager}>
      {renderToolbar()}
      <StudentResourcesTable entity={entity} studentID={studentID} allowRemove={true} />
    </div>
  )
}

export default StudentResourceManager
