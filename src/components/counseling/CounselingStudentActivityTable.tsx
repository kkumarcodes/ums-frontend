// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ArrowUpOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  SaveOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Input, InputNumber, Popconfirm, Row, Select, Space, Table, Tooltip } from 'antd'
import { createColumns, handleSuccess } from 'components/administrator'
import styles from 'components/counseling/styles/CounselingStudentActivityTable.scss'
import { clone, filter, map, orderBy, range, values } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PartialBy } from 'store/common/commonTypes'
import {
  createStudentActivity,
  deleteStudentActivity,
  fetchStudentActivities,
  updateStudentActivity,
} from 'store/counseling/counselingThunks'
import {
  CommonAppActivityCategories,
  StudentActivity,
  StudentActivityCategories,
} from 'store/counseling/counselingTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectIsParent } from 'store/user/usersSelector'
import { ArrowDownOutlined } from '@ant-design/icons'
import { selectStudentActivitiesForStudent } from '../../store/counseling/counselingSelectors'

enum Move {
  Up,
  Down,
}

type Props = {
  studentID: number
  category: StudentActivityCategories
  readOnly?: boolean
}

export const CounselingStudentActivityTable = ({ studentID, category, readOnly = false }: Props) => {
  const dispatch = useReduxDispatch()

  const isParent = useSelector(selectIsParent)
  readOnly = readOnly || !!isParent
  // Ordered in descending 'order', so that newly created activities appear at the top of table after creation
  const studentActivities = orderBy(
    useSelector(selectStudentActivitiesForStudent(studentID)).filter(sa => sa.category === category),
    'order',
    'desc',
  )
  const highestOrder = studentActivities[0]?.order
  const lowestOrder = studentActivities[studentActivities.length - 1]?.order

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [creating, setCreating] = useState(false)

  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [shouldAddRow, setShouldAddRow] = useState(false)

  // The data for the row we are creating or editing
  const [editData, setEditData] = useState<PartialBy<StudentActivity, 'pk' | 'slug'>>()

  const isAward = category === StudentActivityCategories.Award

  // Clears error message
  useEffect(() => {
    if (errorMessage?.includes('name') && editData?.name) {
      setErrorMessage(null)
    }
    if (errorMessage?.includes('year') && editData?.years_active.length) {
      setErrorMessage(null)
    }
  }, [editData, errorMessage])

  useEffect(() => {
    if (studentID) {
      setLoading(true)
      dispatch(fetchStudentActivities({ student_pk: studentID })).finally(() => setLoading(false))
    }
  }, [dispatch, studentID])

  const handleDelete = (pk: number) => {
    dispatch(deleteStudentActivity(pk)).then(() => handleSuccess('Activity deleted!'))
  }

  const resetForm = useCallback(() => {
    setEditData(undefined)
  }, [])

  const setNewRowData = useCallback(() => {
    setEditData({
      name: '',
      position: '',
      description: '',
      category: undefined,
      order: undefined,
      awards: '',
      student: studentID,
      years_active: [],
      hours_per_week: 0,
      weeks_per_year: 0,
      intend_to_participate_college: false,
      during_school_break: false,
      during_school_year: false,
      all_year: false,
      common_app_category: undefined,
      recognition: undefined,
      post_graduate: false,
    })
  }, [studentID])

  const handleUpdate = (studentActivityID: number) => {
    if (!editData?.name) {
      setErrorMessage('Activity name is required')
      return
    }
    if (!editData?.years_active.length) {
      setErrorMessage('Activity must have at least one active academic year')
      return
    }
    const payload = { ...editData, category }

    setUpdating(true)
    dispatch(updateStudentActivity(studentActivityID, payload))
      .then(() => {
        setSelectedRow(null)
        resetForm()
      })
      .finally(() => setUpdating(false))
  }

  const handleCreate = () => {
    if (!editData?.name) {
      setErrorMessage('Activity name is required')
      return
    }
    if (!editData?.years_active.length) {
      setErrorMessage('Activity must have at least one active academic year')
      return
    }
    const payload = { ...editData, category }
    setCreating(true)
    dispatch(createStudentActivity(payload))
      .then(() => {
        setShouldAddRow(false)
        setSelectedRow(null)
        resetForm()
      })
      .finally(() => setCreating(false))
  }

  const handleEdit = (record: StudentActivity) => {
    // Handles awkward case where creation row gets stuck
    // when a user double clicks on existing row (table switches to edit but creation row doesn't vanish)
    if (record.pk !== -1) {
      setShouldAddRow(false)
    }

    if (selectedRow === record.pk) {
      return
    }
    setEditData(clone(record))
    setSelectedRow(record.pk)
  }

  const swapActivityOrder = (order: number, direction: Move) => {
    const selectedActivityIndex = studentActivities.findIndex(sa => sa.order === order)
    const selectedActivity = studentActivities[selectedActivityIndex]

    const otherActivityIndex = direction === Move.Up ? selectedActivityIndex - 1 : selectedActivityIndex + 1
    const otherActivity = studentActivities[otherActivityIndex]

    Promise.all([
      dispatch(updateStudentActivity(selectedActivity.pk, { order: otherActivity.order })),
      dispatch(updateStudentActivity(otherActivity.pk, { order: selectedActivity.order })),
    ])
  }

  const renderName = (_: string, record: StudentActivity) => {
    if (editData && selectedRow === record.pk) {
      return (
        <div className="vertical-form">
          <div className="vertical-form-group">
            <label>{isAward ? 'Honors Title' : 'Organization'}</label>
            <div className="input-container">
              <Input
                className="col name-col"
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                placeholder="Name"
              />
              <div className="max-character-count">{editData.name.length} / 100</div>
            </div>
          </div>
          {!isAward && (
            <>
              <div className="vertical-form-group">
                <label>Position/Leadership:</label>
                <div className="input-container">
                  <Input
                    className="col name-col"
                    value={editData.position}
                    onChange={e => setEditData({ ...editData, position: e.target.value })}
                    placeholder="Position"
                  />
                  <div className="max-character-count">{editData.position.length} / 50</div>
                </div>
              </div>
              <div className="vertical-form-group">
                <label>Type:</label>
                <Select
                  className="select-ca-category"
                  showSearch={true}
                  optionFilterProp="children"
                  value={editData.common_app_category}
                  onChange={e => setEditData({ ...editData, common_app_category: e })}
                >
                  {map(CommonAppActivityCategories, (v, k) => (
                    <Select.Option value={k} key={k}>
                      {v}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </>
          )}
        </div>
      )
    }
    return (
      <div className="col name-col">
        <div className="vertical-display">
          <div className="flex">
            <label>Organization:</label>
            <span>{record.name}</span>
          </div>
          {!isAward && (
            <>
              <div className="flex">
                <label>Position:</label>
                <span>{record.position}</span>
              </div>
              <div className="flex">
                <label>Type:</label>
                <span>{record.common_app_category}</span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderParticipation = (_, record: StudentActivity) => {
    if (editData && selectedRow === record.pk) {
      // Helper function to update edit data with correct grades. Defined here so we know that editData is defined
      const toggleGrade = (year: number) => {
        const idx = editData.years_active.indexOf(year)
        const newYearsActive =
          idx > -1 ? editData.years_active.filter(i => i !== year) : [...editData.years_active, year]
        setEditData({ ...editData, years_active: newYearsActive })
      }
      return (
        <div className="vertical-form participation-form">
          <div className="flex grades">
            <label>Grade(s):</label>
            <div className="grade-checkboxes">
              {range(9, 13).map(i => (
                <Checkbox key={i} checked={editData.years_active.includes(i)} onChange={_ => toggleGrade(i)}>
                  {i}
                </Checkbox>
              ))}
              {isAward && (
                <Checkbox
                  checked={editData.post_graduate}
                  onChange={e => setEditData({ ...editData, post_graduate: e.target.checked })}
                >
                  Post-graduate
                </Checkbox>
              )}
            </div>
          </div>
          {!isAward && (
            <>
              <div className="flex">
                <label>Timing</label>
                <div>
                  <Checkbox
                    checked={editData.during_school_year}
                    onChange={e => setEditData({ ...editData, during_school_year: e.target.checked })}
                  >
                    During school year
                  </Checkbox>
                  <Checkbox
                    checked={editData.during_school_break}
                    onChange={e => setEditData({ ...editData, during_school_break: e.target.checked })}
                  >
                    During school break
                  </Checkbox>
                  <Checkbox
                    checked={editData.all_year}
                    onChange={e => setEditData({ ...editData, all_year: e.target.checked })}
                  >
                    All Year
                  </Checkbox>
                </div>
              </div>
              <div className="flex">
                <label>Hours/week</label>
                <InputNumber
                  className="col hpw-col"
                  defaultValue={0}
                  min={0}
                  precision={1}
                  value={editData.hours_per_week}
                  onChange={e => setEditData({ ...editData, hours_per_week: Number(e) })}
                />
              </div>
              <div className="flex">
                <label>Weeks/year</label>
                <InputNumber
                  className="col hpw-col"
                  defaultValue={0}
                  min={0}
                  precision={1}
                  value={editData.weeks_per_year}
                  onChange={e => setEditData({ ...editData, weeks_per_year: Number(e) })}
                />
              </div>
              <div className="flex">
                <Checkbox
                  checked={editData.intend_to_participate_college}
                  onChange={e => setEditData({ ...editData, intend_to_participate_college: e.target.checked })}
                >
                  Intend to participate in college
                </Checkbox>
              </div>
            </>
          )}
        </div>
      )
    }
    return (
      <div className="vertical-display">
        <div className="flex">
          <label>Grades:</label>
          <span>{record.years_active.join(', ')}</span>
          {isAward && record.post_graduate && <p>Post-graduate</p>}
        </div>

        {!isAward && (
          <>
            <div className="flex">
              <label>Timing:</label>
              <div>
                {record.during_school_year && <p>During School Year</p>}
                {record.during_school_break && <p>During School Break</p>}
                {record.all_year && <p>All Year</p>}
              </div>
            </div>
            <div className="flex">
              <label>Hours/week:</label>
              <span>{record.hours_per_week}</span>
            </div>
            <div className="flex">
              <label>Weeks/year:</label>
              <span>{record.weeks_per_year}</span>
            </div>
            {record.intend_to_participate_college && (
              <div className="flex">
                <CheckOutlined /> Intend to participate in college
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const renderDescription = (_: string, record: StudentActivity) => {
    if (editData && selectedRow === record.pk) {
      return (
        <>
          <Input.TextArea
            className="col desc-col"
            value={editData?.description}
            onChange={e => setEditData({ ...editData, description: e.target.value })}
            placeholder="Description"
            rows={8}
          />
          <br />
          <div className="max-character-count">
            Please describe this activity, including what you accomplished and any recognition you received, etc.
            &nbsp;&nbsp;{editData?.description.length} / 150
          </div>
        </>
      )
    }
    return <div className="col desc-col">{record.description}</div>
  }

  const renderActions = (text: string, record: StudentActivity) => {
    return (
      <Row className="actions-col center">
        {selectedRow !== record.pk && (
          <>
            <Button
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={record.order === highestOrder}
              onClick={() => swapActivityOrder(record.order as number, Move.Up)}
            />

            <Button
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={record.order === lowestOrder}
              onClick={() => swapActivityOrder(record.order as number, Move.Down)}
            />

            <Button className="btn-edit" size="small" onClick={() => handleEdit(record)}>
              <EditOutlined />
            </Button>

            <Popconfirm
              title="Are you sure you want to delete this activity?"
              onConfirm={() => handleDelete(record.pk)}
            >
              <Button className="btn-delete" size="small" disabled={updating}>
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          </>
        )}
        {selectedRow === record.pk && (
          <>
            <Button
              className="btn-cancel"
              size="small"
              onClick={() => {
                if (record.pk === -1) {
                  setShouldAddRow(false)
                  setErrorMessage(null)
                }
                setSelectedRow(null)
              }}
              disabled={(updating || creating) && selectedRow === record.pk}
            >
              <StopOutlined />
            </Button>
            <Tooltip placement="bottomRight" title="Don't forget to save" visible>
              <Button
                className="btn-save"
                size="small"
                type="primary"
                onClick={() => (record.pk === -1 ? handleCreate() : handleUpdate(record.pk))}
                loading={(updating || creating) && selectedRow === record.pk}
              >
                <SaveOutlined />
              </Button>
            </Tooltip>
          </>
        )}
      </Row>
    )
  }

  const columnSeed = [
    { title: 'Activity', dataIndex: 'name', render: renderName, width: 200 },
    { title: 'Participation', dataIndex: 'name', render: renderParticipation, width: 150 },
    { title: 'Description', dataIndex: 'description', render: renderDescription, width: 220 },
  ]
  if (!readOnly) {
    columnSeed.push({ title: 'Actions', dataIndex: 'actions', render: renderActions, width: 50 })
  }

  const columns = createColumns(columnSeed)

  const handleAddingCreateRow = (studentActivities: StudentActivity[]) => {
    // It is assumed that editData has already been updated by the time shouldAddRow is true
    if (shouldAddRow) {
      return [{ ...editData, pk: -1 }, ...studentActivities]
    }
    return studentActivities
  }

  return (
    <div className={styles.CounselingStudentActivityTable}>
      <Row className="add-activity-wrapper" justify="space-between">
        {!readOnly && (
          <Button
            className="add-activity-btn"
            type="primary"
            onClick={() => {
              setNewRowData()
              setShouldAddRow(true)
              setSelectedRow(-1)
            }}
          >
            <PlusCircleOutlined />
            Add {category === StudentActivityCategories.Award ? 'Award' : 'Activity'}
          </Button>
        )}
        {errorMessage && <div className="error-msg">{errorMessage}</div>}
      </Row>
      <Table
        rowKey="pk"
        size="middle"
        className={styles.StudentHighSchoolCourseSmartTable}
        loading={loading}
        bordered={true}
        dataSource={handleAddingCreateRow(studentActivities)}
        columns={columns}
        onRow={(record, rowIndex) => {
          return {
            onDoubleClick: event => handleEdit(record),
          }
        }}
      />
    </div>
  )
}
