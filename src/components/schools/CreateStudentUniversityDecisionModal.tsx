// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import { map, sortBy, values } from 'lodash'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'

import {
  fetchUniversities,
  fetchStudentUniversityDecisions,
  createStudentUniversityDecision,
} from 'store/university/universityThunks'
import { CreateStudentUniversityDecisionProps, MODALS } from 'store/display/displayTypes'
import { selectActiveModal, selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { Select, Modal, message } from 'antd'
import { closeModal } from 'store/display/displaySlice'
import { StudentUniversityDecision, University } from 'store/university/universityTypes'
import styles from './styles/CreateStudentUniversityDecisionModal.scss'

const CreateStudentUniversityDecisionModal = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()

  const [selectedUniversities, setSelectedUniversities] = useState<number[]>([])

  const props = useSelector(
    selectVisibleModalProps(MODALS.CREATE_STUDENT_UNIVERSITY_DECISION),
  ) as CreateStudentUniversityDecisionProps
  const visible = useSelector(selectVisibleModal(MODALS.CREATE_STUDENT_UNIVERSITY_DECISION))

  // All universities not already on student's list
  const { universities, loadedUniversities } = useSelector((state: RootState) => {
    const suds = props?.studentPK
      ? values(state.university.studentUniversityDecisions).filter(sud => sud.student === props.studentPK)
      : []
    const existingUniversities = map(suds, 'university')
    return {
      universities: sortBy(
        values(state.university.universities).filter(u => !existingUniversities.includes(u.pk)),
        ['rank', 'name'],
      ),
      loadedUniversities: state.university.loadedAllUniversities,
    }
  })

  // Load universities and SUDs if necessary
  const studentPK = props?.studentPK
  useEffect(() => {
    if (props?.studentPK) {
      const promises: Promise<StudentUniversityDecision[] | University[]>[] = [
        dispatch(fetchStudentUniversityDecisions({ student: studentPK })),
      ]
      if (!loadedUniversities) {
        promises.push(dispatch(fetchUniversities()))
      }
      Promise.all(promises).finally(() => setLoading(false))
    }
  }, [dispatch, loadedUniversities, props, studentPK, universities.length])

  // Confirmation method. Create our StudentUniversityDecision
  const handleConfirm = () => {
    setLoading(true)
    const promises = selectedUniversities.map(university =>
      dispatch(createStudentUniversityDecision({ student: studentPK, university })),
    )
    Promise.all(promises)
      .then(() => {
        setSelectedUniversities([])
        dispatch(closeModal())
      })
      .catch(e => {
        message.error(e)
      })
      .finally(() => setLoading(false))
  }

  return (
    <Modal
      visible={visible}
      okText={selectedUniversities.length === 1 ? 'Add University' : 'Add Universities'}
      okButtonProps={{ disabled: !selectedUniversities.length }}
      onCancel={() => dispatch(closeModal())}
      onOk={handleConfirm}
      confirmLoading={loading}
      className={styles.createSUDModal}
    >
      <h2 className="center">Add Universities</h2>
      <p className="center help">Search for one or more universities to add them</p>
      <Select
        onChange={v => setSelectedUniversities(v)}
        value={selectedUniversities}
        showSearch={true}
        optionFilterProp="filter"
        mode="multiple"
      >
        {universities.map(u => (
          <Select.Option value={u.pk} key={u.slug} filter={`${u.name} ${u.abbreviations}`}>
            {u.name}
          </Select.Option>
        ))}
      </Select>
    </Modal>
  )
}

export default CreateStudentUniversityDecisionModal
