// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'

import { selectVisibleDiagnosticRegistrationDetailsModal, selectActiveModal } from 'store/display/displaySelectors'
import { DiagnosticRegistrationDetailsProps } from 'store/display/displayTypes'
import { Form, message, Modal, Select } from 'antd'
import { useReduxDispatch } from 'store/store'
import { closeModal } from 'store/display/displaySlice'
import { WrappedTextInput } from 'components/common/FormItems'
import { selectIsAdmin } from 'store/user/usersSelector'
import { updateDiagnosticGTSRegistrationData } from 'store/diagnostic/diagnosticThunks'
import { updateStudent } from 'store/user/usersThunks'
import styles from './styles/DiagnosticRegistrationDetailsModal.scss'
import { PROGRAM_ADVISORS } from '..'

const DiagnosticRegistrationDetailsModal = () => {
  const [saving, setSaving] = useState(false)
  const visible = useSelector(selectVisibleDiagnosticRegistrationDetailsModal)
  const props = useSelector(selectActiveModal)?.modalProps as DiagnosticRegistrationDetailsProps
  const [form] = Form.useForm();
  const dispatch = useReduxDispatch()
  const isAdmin = useSelector(selectIsAdmin)

  const diagnosticRegistrationData = useSelector((state: RootState) => {
    if (props?.diagnosticRegistrationPK)
      return state.diagnostic.diagnosticRegistrations[props.diagnosticRegistrationPK].registration_data
    if (props?.diagnosticResultPK) return state.diagnostic.diagnosticResults[props.diagnosticResultPK].registration_data
    return null
  })
  const studentName = useSelector((state: RootState) => {
    if (props?.diagnosticRegistrationPK)
      return state.diagnostic.diagnosticRegistrations[props.diagnosticRegistrationPK].student_name
    if (props?.diagnosticResultPK) return state.diagnostic.diagnosticResults[props.diagnosticResultPK].student_name
    return ''
  })
  const studentID = useSelector((state: RootState) => {
    if (props?.diagnosticRegistrationPK)
      return state.diagnostic.diagnosticRegistrations[props.diagnosticRegistrationPK].student
    if (props?.diagnosticResultPK) return state.diagnostic.diagnosticResults[props.diagnosticResultPK].student
    return null
  })

  useEffect(() => {
    if (diagnosticRegistrationData && visible) {
      form.setFieldsValue(diagnosticRegistrationData)
    } else {
      form.resetFields()
    }
  }, [diagnosticRegistrationData, form, visible])

  // User clicks to close. If is admin then we save
  const onSaveClose = async () => {
    if (isAdmin && props.diagnosticRegistrationPK) {
      try {
        setSaving(true)
        const registrationData = { ...diagnosticRegistrationData, ...form.getFieldsValue() }
        await dispatch(updateDiagnosticGTSRegistrationData(props.diagnosticRegistrationPK, registrationData))
        if (studentID) {
          await dispatch(updateStudent(studentID, { program_advisor: form.getFieldsValue().program_advisor }))
        }
      } catch {
        message.warn('Unable to save')
      } finally {
        setSaving(false)
      }
    }
    dispatch(closeModal())
  }

  const content = diagnosticRegistrationData ? (
    <Form form={form} layout="vertical">
      <Form.Item name="program_advisor">
        <Select disabled={!isAdmin} placeholder="Select your advisor" className="counselor-dropdown">
          {PROGRAM_ADVISORS.map(pm => (
            <Select.Option key={pm} value={pm}>
              {pm}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <WrappedTextInput isTextArea disabled={!isAdmin} label="Grad Year" name="student_graduation_year" />
      <WrappedTextInput isTextArea disabled={!isAdmin} label="High School" name="student_high_school" />
      <WrappedTextInput isTextArea disabled={!isAdmin} label="ACT Results" name="act_results" />
      <WrappedTextInput isTextArea disabled={!isAdmin} label="SAT Results" name="sat_results" />
      <WrappedTextInput isTextArea disabled={!isAdmin} label="Accomodations" name="disability" />
      <WrappedTextInput isTextArea disabled={!isAdmin} label="Current English" name="english_current" />
      <WrappedTextInput isTextArea disabled={!isAdmin} label="Current math" name="math_current" />
      <WrappedTextInput isTextArea disabled={!isAdmin} label="11th Grade Math" name="math_grade11" />
    </Form>
  ) : (
    ''
  )

  return (
    <Modal
      className={styles.diagRegDetailsModal}
      okButtonProps={{ loading: saving }}
      onOk={onSaveClose}
      okText={isAdmin ? 'Save and Close' : 'OK'}
      onCancel={() => dispatch(closeModal())}
      visible={visible}
      title={`Details for student ${studentName}`}
    >
      {content}
    </Modal>
  )
}

export default DiagnosticRegistrationDetailsModal
