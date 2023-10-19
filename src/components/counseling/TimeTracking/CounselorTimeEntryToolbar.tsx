// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button, Checkbox, DatePicker, Select } from 'antd'
import { getFullName } from 'components/administrator'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { CSVDataTypes } from 'components/common/enums'
import { Moment } from 'moment-timezone'
import React from 'react'
import { useSelector } from 'react-redux'
import { FetchCounselorTimeEntryParams } from 'store/counseling/counselingThunks'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectCounselors, selectIsAdmin, selectStudents } from 'store/user/usersSelector'
import { CounselorTimeEntryPaymentStatus, useCounselorTimeEntryCtx } from './CounselorTimeEntryContext'
import styles from './styles/TimeTracking.scss'

type Props = {
  displayDateFilter?: boolean
  displayCounselorFilter?: boolean
  displayStudentFilter?: boolean
  forceStudent?: number
}

const CounselorTimeEntryToolbar = ({
  displayCounselorFilter,
  displayStudentFilter,
  displayDateFilter = true,
  forceStudent = undefined,
}: Props) => {
  const context = useCounselorTimeEntryCtx()
  const dispatch = useReduxDispatch()

  const counselors = useSelector(selectCounselors)
  const isAdmin = useSelector(selectIsAdmin)
  let students = useSelector(selectStudents)
  // Filtering for counselor yields only student options for that counselor
  if (displayCounselorFilter) {
    students = students.filter(s => s.counselor && (!context.counselor || context.counselor === s.counselor))
  }

  const updateDateRange = (dates: [Moment | null, Moment | null] | null, dateStrings: [string, string]) => {
    context.setStart(dates?.[0] || undefined)
    context.setEnd(dates?.[1] || undefined)
  }

  const csvQueryParams: FetchCounselorTimeEntryParams = {}
  if (context.student) csvQueryParams.student = context.student
  if (context.counselor) csvQueryParams.counselor = context.counselor
  if (context.start) csvQueryParams.start = context.start.format('YYYY-MM-DD')
  if (context.end) csvQueryParams.end = context.end.format('YYYY-MM-DD')
  if (context.paygo) csvQueryParams.paygo = true
  if (context.paymentStatus === CounselorTimeEntryPaymentStatus.Paid) csvQueryParams.paid = 'true'
  else if (context.paymentStatus === CounselorTimeEntryPaymentStatus.Unpaid) csvQueryParams.paid = 'false'

  // If we're showing paygo only then we only show paygo student options
  const displayStudents = context.paygo
    ? students.filter(s => s.is_paygo || s.counseling_student_types_list.join(' ').toLowerCase().includes('paygo'))
    : students

  return (
    <div className={styles.counselorTimeEntryToolbar}>
      <div className="tb-outer-container tb-container">
        <Button
          type="primary"
          onClick={() =>
            dispatch(
              showModal({
                modal: MODALS.COUNSELOR_TIME_ENTRY_MODAL,
                props: { studentPK: context.student, counselorPK: context.counselor },
              }),
            )
          }
        >
          <PlusCircleOutlined />
          Log Time
        </Button>
        {isAdmin && (
          <>
            <Button
              type="primary"
              onClick={() =>
                dispatch(
                  showModal({
                    modal: MODALS.COUNSELING_HOURS_GRANT_MODAL,
                    props: { studentID: forceStudent },
                  }),
                )
              }
            >
              <PlusCircleOutlined />
              Add Time to Student
            </Button>
            <DownloadCSVButton
              title="Download Time Spent"
              dataType={CSVDataTypes.CounselorTimeEntry}
              queryParams={csvQueryParams}
            />
            <DownloadCSVButton
              title="Download Time Granted"
              dataType={CSVDataTypes.CounselingHoursGrants}
              queryParams={csvQueryParams}
            />
            <DownloadCSVButton
              title="Download Current Time"
              dataType={CSVDataTypes.StudentCounselingHours}
              queryParams={csvQueryParams}
            />
          </>
        )}
      </div>
      <div className="tb-outer-container tb-container">
        {displayCounselorFilter && (
          <div className="tb-container">
            <label>Counselor:</label>
            <Select
              value={context.counselor}
              onChange={context.setCounselor}
              showSearch={true}
              allowClear={true}
              optionFilterProp="children"
            >
              {counselors.map(c => (
                <Select.Option key={c.slug} value={c.pk}>
                  {getFullName(c)}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
        {displayStudentFilter && (
          <>
            <div className="tb-container">
              <label>Student:</label>
              <Select
                value={context.student}
                onChange={context.setStudent}
                showSearch={true}
                allowClear={true}
                optionFilterProp="children"
              >
                {displayStudents.map(c => (
                  <Select.Option key={c.slug} value={c.pk}>
                    {getFullName(c)}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="tb-container">
              <Checkbox value={context.paygo} onChange={e => context.setPaygo(e.target.checked)}>
                Paygo Students Only
              </Checkbox>
            </div>
            <div className="tb-container">
              <Select value={context.paymentStatus} onChange={context.setPaymentStatus}>
                <Select.Option value={CounselorTimeEntryPaymentStatus.PaidAndUnpaid}>Paid and Unpaid</Select.Option>
                <Select.Option value={CounselorTimeEntryPaymentStatus.Paid}>Paid Only</Select.Option>
                <Select.Option value={CounselorTimeEntryPaymentStatus.Unpaid}>Unpaid Only</Select.Option>
              </Select>
            </div>
          </>
        )}
        {displayDateFilter && (
          <div className="tb-container">
            <label>Dates:</label>
            <DatePicker.RangePicker
              value={context?.start && context?.end ? [context.start, context.end] : undefined}
              allowClear={true}
              onChange={updateDateRange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
export default CounselorTimeEntryToolbar
