// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DatePicker, Form, Input, Select } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { handleError, handleSuccess } from 'components/administrator'
import { WrappedFormControl, WrappedSingleUpload, WrappedTextInput } from 'components/common/FormItems'
import TestDates from 'copy/TestDates'
import { keys } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { FileUpload, UploadFile } from 'store/common/commonTypes'
import { createTestResult, fetchTestResult, updateTestResult } from 'store/diagnostic/diagnosticThunks'
import {
  DEFAULT_SUBSCORE_FIELDS,
  SubscoreFieldDescriptor,
  SUBSCORE_FIELDS,
  TestResult,
  TestType,
} from 'store/diagnostic/diagnosticTypes'
import { closeModal } from 'store/display/displaySlice'
import { useReduxDispatch } from 'store/store'
import styles from './styles/TestResult.scss'

type Props = {
  student: number
  testResultPK?: number
  wrapperCN?: string
}

const CUSTOM_DATE = 'custom'

export const TestResultForm = ({ wrapperCN, student, testResultPK }: Props) => {
  const [form] = Form.useForm()
  const dispatch = useReduxDispatch()
  const [selectedTestType, setSelectedTestType] = useState<TestType>()
  const [selectedDate, setSelectedDate] = useState<string>()
  const [editFileUpload, setEditFileUpload] = useState<UploadFile>()
  useEffect(() => {
    if (testResultPK) {
      dispatch(fetchTestResult(testResultPK)).then(testResult => {
        form.setFieldsValue({
          ...testResult,
          test_date: moment(testResult?.test_date),
          test_type: testResult?.test_type,
        })
        if (testResult.file_uploads) setEditFileUpload(testResult.file_uploads[0])
        setSelectedTestType(testResult?.test_type || undefined)
        setSelectedDate(CUSTOM_DATE)
      })
    } else {
      setEditFileUpload(undefined)
      setSelectedTestType(undefined)
      setSelectedDate(undefined)
      form.resetFields()
    }
  }, [dispatch, form, testResultPK])

  const [loading, setLoading] = useState(false)

  const handleFinish = (values: Store) => {
    setLoading(true)
    let testDate: string | null = null
    if (values.test_date_select && values.test_date_select !== CUSTOM_DATE)
      testDate = moment(values.test_date_select).toISOString()
    else if (values.test_date) testDate = values.test_date.toISOString()
    const payload: Partial<TestResult> = {
      ...values,
      student,
    }
    if (testDate) payload.test_date = testDate

    // extract first (and only) file object from array, then remove the essay
    if (values.fileList && values.fileList[0]) {
      payload.update_file_uploads = [values.fileList[0]?.response.slug]
      delete payload.fileList
    } else if (editFileUpload) {
      payload.update_file_uploads = [editFileUpload.slug]
    }

    dispatch(testResultPK ? updateTestResult(testResultPK, payload) : createTestResult(payload))
      .then(() => handleSuccess(testResultPK ? 'Test updated!' : 'Test created!'))
      .catch(err => handleError(`Failed ${testResultPK ? 'update' : 'create'} test`))
      .finally(() => {
        setLoading(false)
        dispatch(closeModal())
      })
  }

  const renderScores = () => {
    if (!selectedTestType) return <p className="help center">Select a test type...</p>
    const fields: SubscoreFieldDescriptor[] = SUBSCORE_FIELDS.hasOwnProperty(selectedTestType)
      ? SUBSCORE_FIELDS[selectedTestType]
      : DEFAULT_SUBSCORE_FIELDS
    return (
      <div className="scores">
        {fields.map(f => (
          <Form.Item key={f.name} required={false} name={f.name} label={f.label}>
            <Input type="number" />
          </Form.Item>
        ))}
      </div>
    )
  }

  // Render test dates for selected test type
  const dateOptions = TestDates.hasOwnProperty(selectedTestType as string) ? TestDates[selectedTestType] : null

  // TODO: Replace with wrappers
  return (
    <div className={wrapperCN}>
      <Form
        className={styles.testResultForm}
        form={form}
        onFinish={handleFinish}
        initialValues={{ test_date: moment() }}
        layout="vertical"
      >
        <Form.Item name="test_type" label="Test Type" required>
          <Select
            value={selectedTestType}
            onChange={setSelectedTestType}
            options={keys(TestType).map(t => ({ label: t, value: t }))}
          />
        </Form.Item>
        <div className="flex date-container">
          {dateOptions && (
            <Form.Item name="test_date_select" label="Test Date">
              <Select
                value={selectedDate}
                onChange={setSelectedDate}
                options={[
                  ...dateOptions.map(o => ({ label: moment(o).format('MMM Do, YYYY'), value: o })),
                  { label: 'Other Date...', value: CUSTOM_DATE },
                ]}
              />
            </Form.Item>
          )}
          {(!dateOptions || selectedDate === CUSTOM_DATE) && (
            <Form.Item name="test_date" label="Test Date">
              <DatePicker picker="date" />
            </Form.Item>
          )}
        </div>

        <WrappedTextInput name="title" label="Title / Name" />
        <WrappedSingleUpload
          action="/cw/upload/"
          name="fileList"
          label="Upload File (Optional)"
          setFieldsValue={form.setFieldsValue}
        />
        <hr />
        <h2 className="center f-subtitle-1">Scores</h2>
        {renderScores()}
        <WrappedFormControl loading={loading} />
      </Form>
    </div>
  )
}
