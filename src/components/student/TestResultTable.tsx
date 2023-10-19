// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined, EditOutlined, FileOutlined } from '@ant-design/icons'
import { Button, DatePicker, Input, Popconfirm, Row, Space, Table } from 'antd'
import { TableProps } from 'antd/lib/table'
import { createColumns, getFullName } from 'components/administrator'
import { renderHighlighter } from 'components/administrator/helpers'
import styles from 'components/student/styles/TestResult.scss'
import moment, { Moment } from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectTestResults } from 'store/diagnostic/diagnosticSelectors'
import { deleteTestResult, fetchTestResults } from 'store/diagnostic/diagnosticThunks'
import {
  DEFAULT_SUBSCORE_FIELDS,
  SubscoreFieldDescriptor,
  SUBSCORE_FIELDS,
  TestResult,
} from 'store/diagnostic/diagnosticTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { getStudents, selectIsParent } from 'store/user/usersSelector'
import { StudentHighSchoolCourse } from 'store/user/usersTypes'

const dateFormat = 'MMM Do YYYY'
const { RangePicker } = DatePicker

type Props = {
  tutorID?: number
  studentPK?: number
  readOnly?: boolean
} & TableProps<TestResult>

/**
 * Renders a table of student test results.
 *
 * If studentPK is passed only test results for given student will be displayed
 *
 * If tutorID is passed test results for all students associated with given tutor are displayed
 *
 * NOTE: studentPK and tutorID are mutually exclusive (i.e. only one should be defined)
 */
export const TestResultTable = ({ studentPK, tutorID, readOnly = false, ...tableProps }: Props) => {
  const dispatch = useReduxDispatch()
  const isParent = useSelector(selectIsParent)
  readOnly = readOnly || !!isParent

  const [loading, setLoading] = useState(false)
  const [selectedStart, setStart] = useState<Moment | null>()
  const [selectedEnd, setEnd] = useState<Moment | null>()
  const [search, setSearch] = useState('')

  const students = useSelector(getStudents)
  const testResults = useSelector(selectTestResults).filter(tr => (studentPK ? tr.student === studentPK : true))

  const handleDelete = ({ pk }: { pk: number }) => dispatch(deleteTestResult(pk))
  const renderActions = (text: string, record: StudentHighSchoolCourse) => {
    return (
      <Row>
        <Button
          className="buttonEdit"
          size="small"
          onClick={() =>
            dispatch(
              showModal({
                modal: MODALS.TEST_RESULT,
                props: { student: record.student, pk: record.pk },
              }),
            )
          }
        >
          <EditOutlined />
        </Button>
        <Popconfirm title="Are you sure you want to delete this test?" onConfirm={() => handleDelete(record)}>
          <Button size="small" className="buttonDelete">
            <DeleteOutlined />
          </Button>
        </Popconfirm>
      </Row>
    )
  }

  useEffect(() => {
    setLoading(true)
    if (studentPK) {
      dispatch(fetchTestResults({ student: studentPK })).finally(() => setLoading(false))
    } else if (tutorID) {
      dispatch(fetchTestResults({ tutor: tutorID })).finally(() => setLoading(false))
    } else {
      dispatch(fetchTestResults()).finally(() => setLoading(false))
    }
  }, [dispatch, studentPK, tutorID])

  const renderStudent = (studentPk: number) => renderHighlighter(getFullName(students[studentPk]), search)
  const renderDate = (date: string) => moment(date).format('MMM Do, YYYY')
  const renderTestType = (_, test: TestResult) => (
    <>
      <p className="test-type">{test.test_type}</p>
      {test.title && <p className="help">{test.title}</p>}{' '}
    </>
  )
  const renderScore = (_, test: TestResult) => {
    const fields: SubscoreFieldDescriptor[] = SUBSCORE_FIELDS.hasOwnProperty(test.test_type)
      ? SUBSCORE_FIELDS[test.test_type]
      : DEFAULT_SUBSCORE_FIELDS

    return (
      <div className="scores">
        {fields
          .filter(f => test[f.name])
          .map(f => (
            <p className="score flex" key={f.name}>
              <strong className="right">{f.label}: </strong>
              <span>{test[f.name]}</span>
            </p>
          ))}
      </div>
    )
  }

  const renderFileUpload = fileUploads => {
    if (fileUploads[0]) {
      return (
        <a href={`/cw/upload/${fileUploads[0].slug}`} target="_blank" rel="noopener noreferrer">
          View Upload &nbsp;
          <FileOutlined />
        </a>
      )
    }
  }

  const columnSeed = [
    { name: 'test_date', title: 'Date', dataIndex: 'test_date', render: renderDate },
    { name: 'test_type', title: 'Test Type', dataIndex: 'test_type', render: renderTestType },
    { name: 'score', title: 'Score', dataIndex: 'score', render: renderScore },
    { name: 'file_uploads', title: 'File Upload', dataIndex: 'file_uploads', render: renderFileUpload },
  ]
  if (tutorID)
    columnSeed.splice(1, 0, { name: 'student', title: 'Student', dataIndex: 'student', render: renderStudent })

  if (!readOnly) columnSeed.push({ name: 'actions', title: 'Actions', dataIndex: 'actions', render: renderActions })
  const columns = createColumns(columnSeed)

  const handleCalendarChange = (dates: [Moment | null | undefined, Moment | null | undefined] | null) => {
    if (dates !== null && dates[0] !== null) {
      setStart(dates[0])
    }
    if (dates !== null && dates[1] !== null) {
      setEnd(dates[1])
    }
    if (dates === null) {
      setStart(undefined)
      setEnd(undefined)
    }
  }

  const renderTableToolbar = () => {
    return (
      <Row justify="end">
        <Input
          className="test-result-search"
          placeholder="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <RangePicker className="rangePicker" format={dateFormat} onCalendarChange={handleCalendarChange} />
      </Row>
    )
  }

  const handleFilter = (testResults: TestResult[]) => {
    const trimmedSearch = search.trim().toLowerCase()
    // Note we need to add 1 day to the test_date to ensure date filter works as expected
    if (trimmedSearch || (selectedStart && selectedEnd)) {
      return testResults.filter(
        testResult =>
          getFullName(students[testResult.student]).toLowerCase().includes(trimmedSearch) &&
          (!selectedStart || moment(testResult.test_date).add('1', 'd').isSameOrAfter(selectedStart)) &&
          (!selectedEnd || moment(testResult.test_date).isSameOrBefore(selectedEnd)),
      )
    } else {
      return testResults
    }
  }

  return (
    <div className={styles.testResultTable}>
      <Space direction="vertical" size="large">
        {tutorID && renderTableToolbar()}
        <Table
          className={styles.tableTestResult}
          dataSource={handleFilter(testResults)}
          columns={columns}
          loading={loading}
          rowKey="slug"
          bordered={true}
          pagination={{ hideOnSinglePage: true }}
          size="small"
          {...tableProps}
        />
      </Space>
    </div>
  )
}
