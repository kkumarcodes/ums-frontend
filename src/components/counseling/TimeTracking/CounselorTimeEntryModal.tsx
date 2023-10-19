// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import { find, map, sortBy, startCase, values } from 'lodash'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'
import moment, { Moment } from 'moment'

import { Modal, Form, Select, Input, InputNumber } from 'antd'
import { selectVisibleModal, selectActiveModal } from 'store/display/displaySelectors'
import { MODALS, CounselorTimeEntryProps } from 'store/display/displayTypes'
import { WrappedDatePicker, WrappedSwitch } from 'components/common/FormItems'
import { CounselorTimeEntry, CounselorTimeEntryCategory } from 'store/counseling/counselingTypes'

import { selectCounselors, selectIsAdmin, selectStudents } from 'store/user/usersSelector'
import { getFullName } from 'components/administrator'
import {
  createCounselorTimeEntry,
  fetchCounselorTimeCards,
  updateCounselorTimeEntry,
} from 'store/counseling/counselingThunks'
import { closeModal } from 'store/display/displaySlice'
import { selectCounselorTimeCards } from 'store/counseling/counselingSelectors'
import { WarningOutlined } from '@ant-design/icons'
import styles from './styles/TimeTracking.scss'

const HOURS_TO_MINUTES = 60

const TIME_CATEGORY_MEETING_LIST = values(CounselorTimeEntryCategory).filter(
  (category: string) => category.includes('meeting') && !category.includes('other') && !category.includes('admin'),
)

const TIME_CATEGORY_OTHER_LIST = values(CounselorTimeEntryCategory).filter((category: string) =>
  category.includes('other'),
)

const TIME_CATEGORY_ADMIN_LIST = values(CounselorTimeEntryCategory).filter((category: string) =>
  category.includes('admin'),
)

const CounselorTimeEntryModal = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.COUNSELOR_TIME_ENTRY_MODAL))
  const props = useSelector(selectActiveModal)?.modalProps as CounselorTimeEntryProps
  const [form] = Form.useForm();
  const isAdmin = useSelector(selectIsAdmin)
  const [counselor, setCounselor] = useState<number>()
  const [date, setDate] = useState<Moment | null>()

  // We filter by student having counselor here (instead of counseling_student_types_list) to get CAS students
  // because it's how students are filtered in time entry toolbar component
  const students = sortBy(useSelector(selectStudents), 'last_name').filter(s => s.counselor)
  const counselors = sortBy(useSelector(selectCounselors), 'last_name').filter(c => c.part_time)

  const editCounselorTimeEntry = useSelector((state: RootState) =>
    props?.counselorTimeEntryPK ? state.counseling.counselorTimeEntries[props.counselorTimeEntryPK] : null,
  )
  const counselorTimeCards = useSelector(selectCounselorTimeCards).filter(tc => tc.counselor === counselor)

  const propTimeCard = !props?.addingTime ? find(counselorTimeCards, tc => tc.pk === props?.timeCard) : null
  // Whether or not counselor has a time card for the date selected (we show option to include this time on that
  // time card if they do)
  const timeCardForDate = date
    ? find(counselorTimeCards, tc => date.isBetween(moment(tc.start), moment(tc.end)))
    : undefined

  const propStudent = props?.studentPK
  let propCounselor = props?.counselorPK
  if (!propCounselor && propStudent) {
    const student = students.find(s => s.pk === propStudent)
    propCounselor = student?.counselor
  }

  // When selected counselor changes, we load their time cards so we know whether or not to add time to existing
  // time card
  useEffect(() => {
    if (visible && counselor) {
      dispatch(fetchCounselorTimeCards({ counselor }))
    }
  }, [counselor, dispatch, visible])

  useEffect(() => {
    if (visible && editCounselorTimeEntry) {
      form.setFieldsValue({
        ...editCounselorTimeEntry,
        date: moment(editCounselorTimeEntry.date),
        hours: Math.abs(editCounselorTimeEntry.hours * HOURS_TO_MINUTES),
      })
      setDate(moment(editCounselorTimeEntry.date))
      setCounselor(editCounselorTimeEntry.counselor)
    } else if (visible) {
      form.resetFields()
      setCounselor(propCounselor)
      form.setFieldsValue({
        student: propStudent,
        counselor: propCounselor,
        include_on_time_card: Boolean(props?.timeCard),
      })
    }
  }, [editCounselorTimeEntry, form, propCounselor, propStudent, props, visible])

  const doSave = async () => {
    try {
      setLoading(true)
      await form.validateFields()
      const values: Partial<CounselorTimeEntry> & { include_on_time_card?: boolean } = form.getFieldsValue()
      if (values.include_on_time_card && propTimeCard) {
        values.counselor_time_card = propTimeCard.pk
      } else if (values.include_on_time_card && timeCardForDate) {
        values.counselor_time_card = timeCardForDate.pk
      }
      // Even less intuitive is that hours is currently in minutes, so we convert back to hours
      // Note: backend limits precision to 2 decimal places
      values.hours = values.hours ? Number((values.hours / HOURS_TO_MINUTES).toFixed(2)) : values.hours
      if (props?.counselorTimeEntryPK) {
        await dispatch(updateCounselorTimeEntry({ ...values, pk: props.counselorTimeEntryPK }))
      } else {
        await dispatch(createCounselorTimeEntry(values))
      }
      setLoading(false)
      dispatch(closeModal())
      return true
    } catch {
      setLoading(false)
      return false
    }
  }

  let addingToTimeCard = propTimeCard
  // If we got time card to add this time entry to as a prop, then we are DEFINITELY adding to that time card
  // Otherwise, we will offer the option of adding to timeCardForDate if that time card is NOT approved
  // or current user is an admin (counselors can't add time to approved time card)
  if (!addingToTimeCard && timeCardForDate && (!timeCardForDate.admin_has_approved || isAdmin)) {
    addingToTimeCard = timeCardForDate
  }

  const showTimeCardOption = addingToTimeCard && !props?.counselorTimeEntryPK
  // We show a warning next to date if we're adding to a tie card that covers different date range
  // from new time entry's date
  const showTimeWarning =
    showTimeCardOption &&
    addingToTimeCard &&
    date &&
    !date.isBetween(moment(addingToTimeCard.start), moment(addingToTimeCard.end))

  const timeCardHelpText = addingToTimeCard
    ? `Include on existing time card (${moment(addingToTimeCard.start).format('MM/DD/YY')} - ${moment(
        addingToTimeCard.end,
      ).format('MM/DD/YY')})? ${addingToTimeCard.admin_has_approved ? 'This time card has already been approved.' : ''}`
    : ''

  return (
    <Modal
      onOk={doSave}
      okButtonProps={{ loading }}
      okText="Save"
      onCancel={() => dispatch(closeModal())}
      visible={visible}
      className={styles.counselorTimeEntryModal}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="category" label="Category">
          <Select>
            <Select.OptGroup label="Meeting">
              {TIME_CATEGORY_MEETING_LIST.map((category: string) => (
                <Select.Option value={category} key={category}>
                  {startCase(category).split(' ').slice(1).join(' ')}
                </Select.Option>
              ))}
            </Select.OptGroup>
            <Select.OptGroup label="Other">
              {TIME_CATEGORY_OTHER_LIST.map((category: string) => (
                <Select.Option value={category} key={category}>
                  {startCase(category).split(' ').slice(1).join(' ')}
                </Select.Option>
              ))}
            </Select.OptGroup>
            <Select.OptGroup label="Admin">
              {TIME_CATEGORY_ADMIN_LIST.map((category: string) => (
                <Select.Option value={category} key={category}>
                  {startCase(category).split(' ').slice(1).join(' ')}
                </Select.Option>
              ))}
            </Select.OptGroup>
          </Select>
        </Form.Item>
        <WrappedDatePicker value={date} onChange={setDate} name="date" label="Date" showTime={false} />
        {showTimeCardOption ? (
          <WrappedSwitch name="include_on_time_card" label="Include on existing time card" help={timeCardHelpText} />
        ) : (
          ''
        )}
        {showTimeWarning && (
          <div className="time-warning">
            <WarningOutlined />
            The date for this time entry does not fall within the date range for the selected time card
          </div>
        )}

        <Form.Item name="hours" label="Minutes">
          <InputNumber
            precision={0}
            step={10}
            defaultValue={editCounselorTimeEntry?.hours ? editCounselorTimeEntry.hours * HOURS_TO_MINUTES : undefined}
          />
        </Form.Item>

        {isAdmin && (
          <>
            <Form.Item name="counselor" label="Counselor">
              <Select
                showSearch={true}
                optionFilterProp="label"
                options={map(counselors, c => ({ label: getFullName(c), value: c.pk }))}
                disabled={Boolean(propStudent) || Boolean(propCounselor)}
                value={counselor}
                onChange={setCounselor}
              />
            </Form.Item>
            <Form.Item name="pay_rate" label="Pay Rate (if different from default for counselor/student)">
              <InputNumber precision={0} step={10} defaultValue={undefined} />
            </Form.Item>
          </>
        )}
        <Form.Item name="student" label="Student">
          <Select
            showSearch={true}
            optionFilterProp="label"
            options={map(students, c => ({ label: getFullName(c), value: c.pk }))}
            disabled={Boolean(propStudent)}
          />
        </Form.Item>
        <Form.Item name="note" label="Note">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  )
}
export default CounselorTimeEntryModal
