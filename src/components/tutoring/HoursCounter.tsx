// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CreditCardOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import styles from './styles/HoursCounter.scss'

interface OwnProps {
  studentPK: number
}

const HoursCounter = (props: OwnProps) => {
  const dispatch = useReduxDispatch()
  const student = useSelector((state: RootState) => {
    return state.user.students[props.studentPK]
  })

  return (
    <div className={`${styles.hoursCounter} app-white-container`}>
      <div className="counters">
        <div className="hours-counter-item">
          <p>
            Individual Test
            <br />
            Prep Hours
          </p>
          <h3 className="rokkitt">{Math.max(student.individual_test_prep_hours, 0)}</h3>
        </div>
        <div className="hours-counter-item">
          <p>
            Group Test
            <br />
            Prep Hours
          </p>
          <h3 className="rokkitt">{Math.max(student.group_test_prep_hours, 0)}</h3>
        </div>
        <div className="hours-counter-item">
          <p>
            Individual Curriculum
            <br />
            Hours
          </p>
          <h3 className="rokkitt">{Math.max(student.individual_curriculum_hours, 0)}</h3>
        </div>
      </div>
      <div className="right buttons-container">
        <Button
          type="primary"
          onClick={() =>
            dispatch(showModal({ modal: MODALS.PURCHASE_TUTORING_PACKAGE, props: { studentID: props.studentPK } }))
          }
        >
          <CreditCardOutlined />
          &nbsp;Purchase Hours or Class
        </Button>
        <Button
          type="primary"
          onClick={() =>
            dispatch(showModal({ modal: MODALS.CREATE_TUTORING_SESSION, props: { studentID: props.studentPK } }))
          }
        >
          <PlusCircleOutlined />
          &nbsp; Schedule Tutoring Session
        </Button>
      </div>
    </div>
  )
}

export default HoursCounter
