// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Checkbox, Col, Modal, Row, Select, Space, Steps } from 'antd'
import { getFullName } from 'components/administrator'
import { CreateCounselingTaskForm } from 'components/counseling/CreateCounselingTaskForm'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import {
  selectAllStudentGradYears,
  selectAllStudentPackages,
  selectAllUniqueStudentTags,
  selectStudents,
} from 'store/user/usersSelector'
import { CounselingStudentType } from 'store/user/usersTypes'
import styles from './styles/BulkAssignTaskModal.scss'

const FILTER_STUDENT_STEP = 0
const SELECT_STUDENT_STEP = 1
const SUBMIT_BULK_CREATE_STEP = 2

export const BulkAssignTaskModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.BULK_ASSIGN_TASK_MODAL))

  const [showFormPreview, setShowFormPreview] = useState(false)

  const [current, setCurrent] = React.useState(FILTER_STUDENT_STEP)
  const [classYears, setClassYears] = useState<Array<number>>([])
  const [tags, setTags] = useState<Array<string>>([])
  const [packages, setPackages] = useState<Array<string>>([])
  const [forUserBulkCreate, setForUserBulkCreate] = useState<Array<number>>([]) // Array of student.user_ids

  const allGradYears = useSelector(selectAllStudentGradYears)
  const allTags = useSelector(selectAllUniqueStudentTags)
  const allPackages = useSelector(selectAllStudentPackages)
  const allStudents = useSelector(selectStudents)

  const filteredStudents = allStudents.filter(student => {
    return (
      (!classYears.length || classYears.includes(student.graduation_year)) &&
      (!packages.length ||
        packages.some(counselingPackage =>
          student.counseling_student_types_list.includes(counselingPackage as CounselingStudentType),
        )) &&
      (!tags.length || tags.some(tag => student.tags.includes(tag)))
    )
  })

  // Select options
  const gradYearOptions = allGradYears.map(gradYear => ({ label: gradYear, value: gradYear }))
  const tagOptions = allTags.map(tag => ({ label: tag, value: tag }))
  const packageOptions = allPackages.map(counselingPackage => ({
    label: counselingPackage,
    value: counselingPackage,
  }))

  // CheckboxGroup options
  const filteredStudentOptions = filteredStudents.map(student => ({
    label: getFullName(student),
    value: student.user_id,
  }))

  const reset = () => {
    setCurrent(FILTER_STUDENT_STEP)
    setClassYears([])
    setTags([])
    setPackages([])
  }

  /** Reset form on launch */
  useEffect(() => {
    if (visible) {
      reset()
    }
  }, [visible])

  /** Make all student checkboxes begin as `checked` */
  useEffect(() => {
    if (current === SELECT_STUDENT_STEP) {
      setForUserBulkCreate(filteredStudents.map(student => student.user_id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const nextStep = () => {
    setCurrent(current + 1)
  }

  const prevStep = () => {
    setCurrent(current - 1)
  }

  const filterStudentStep = (
    <div className={styles.filterStudentStep}>
      <Space direction="vertical" size="large">
        <Row justify="space-between">
          <div className="two-col-select">
            <label className="label-select h3">Graduation Year:</label>
            <Select
              options={gradYearOptions}
              className="w100"
              mode="multiple"
              value={classYears}
              onChange={setClassYears}
              placeholder="Select Grad Years"
            />
          </div>
          <div className="two-col-select">
            <label className="label-select h3">Tags:</label>
            <Select
              className="w100"
              options={tagOptions}
              mode="multiple"
              value={tags}
              onChange={setTags}
              placeholder="Select Student Tags"
            />
          </div>
        </Row>
        <div className="one-col-select">
          <label className="label-select h3">Packages:</label>
          <Select
            options={packageOptions}
            className="w100"
            mode="multiple"
            value={packages}
            onChange={setPackages}
            placeholder="Select Student Packages"
          />
        </div>
      </Space>
    </div>
  )

  const selectStudentStep = (
    <div className={styles.selectStudentStep}>
      <Row justify="space-between" align="middle" className="header">
        <label className="label-select h3">Select Students:</label>
        <div>
          <Button onClick={() => setForUserBulkCreate(filteredStudents.map(student => student.user_id))}>
            Select All
          </Button>
          <Button onClick={() => setForUserBulkCreate([])} className="select-none-btn">
            Select None
          </Button>
        </div>
      </Row>
      <Checkbox.Group onChange={setForUserBulkCreate} value={forUserBulkCreate}>
        <Row>
          {filteredStudentOptions.map(option => (
            <Col span={11} offset={1} key={option.value}>
              <Checkbox value={option.value}>{option.label}</Checkbox>
            </Col>
          ))}
        </Row>
      </Checkbox.Group>
    </div>
  )

  const steps = [
    {
      title: 'Select Filters',
      content: filterStudentStep,
    },
    {
      title: 'Select Students ',
      content: selectStudentStep,
    },
    {
      title: 'Create Tasks',
      content: (
        <CreateCounselingTaskForm
          showFormPreview={showFormPreview}
          setShowFormPreview={setShowFormPreview}
          forUserBulkCreate={forUserBulkCreate}
          prevStep={prevStep}
        />
      ),
    },
  ]

  return (
    <Modal
      title="Bulk Assign Task"
      visible={visible}
      onCancel={() => dispatch(closeModal())}
      footer={null}
      className={styles.bulkAssignTaskModal}
      width={showFormPreview ? 1400 : 760}
    >
      <Steps current={current}>
        {steps.map(item => (
          <Steps.Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <div className="steps-content">{steps[current].content}</div>
      {current !== SUBMIT_BULK_CREATE_STEP && (
        <div className="steps-action right">
          {current > FILTER_STUDENT_STEP && <Button onClick={prevStep}>Previous</Button>}
          {current < SUBMIT_BULK_CREATE_STEP && (
            <Button
              type="primary"
              onClick={nextStep}
              className="next-btn"
              disabled={current === SELECT_STUDENT_STEP && !forUserBulkCreate.length}
            >
              Next
            </Button>
          )}
        </div>
      )}
    </Modal>
  )
}
