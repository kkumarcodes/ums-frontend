// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Input, message, Modal, Select, Skeleton } from 'antd'
import { getFullName } from 'components/administrator'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { closeModal } from 'store/display/displaySlice'
import { CreateTutoringPackagePurchaseProps, MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import {
  createTutoringPackagePurchase,
  CreateTutoringPackagePurchasePayload,
  fetchTutoringPackages,
} from 'store/tutoring/tutoringThunks'
import { fetchStudents } from 'store/user/usersThunks'
import { selectActiveModal, selectVisibleModal } from 'store/display/displaySelectors'
import { selectIsAdmin } from 'store/user/usersSelector'
import { Store } from 'antd/lib/form/interface'
import styles from './styles/TutoringPackagePurchaseModal.scss'

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
}

type FormFields = {
  student: number
  package: number
  price?: number
  admin_note?: string
}

export const CreateTutoringPackagePurchaseModal: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<number>()
  const [form] = Form.useForm()
  const dispatch = useReduxDispatch()

  const visible = useSelector(selectVisibleModal(MODALS.CREATE_TUTORING_PACKAGE_PURCHASE))
  const modalProps = useSelector(selectActiveModal)?.modalProps as CreateTutoringPackagePurchaseProps
  const students = useSelector((state: RootState) =>
    visible && !(modalProps?.student && modalProps.hideStudent) ? Object.values(state.user.students) : [],
  )
  const packages = useSelector((state: RootState) =>
    visible && !(modalProps?.package && modalProps.hidePackage) ? Object.values(state.tutoring.tutoringPackages) : [],
  )
  const isAdmin = useSelector(selectIsAdmin)

  const loadStudents = !(modalProps?.student && modalProps.hideStudent) && !students.length
  const loadPackages = !(modalProps?.package && modalProps.hidePackage) && !packages.length

  if (modalProps?.hideStudent && modalProps.hidePackage) {
    new Error('Cannot hide both student and packages in CreateTutoringPackagePurchaseModal')
  }

  // Change selected student/package when props chage
  const propsStudent = modalProps?.student
  const propsPackage = modalProps?.package
  useEffect(() => {
    if (propsStudent) {
      form.setFieldsValue({ student: propsStudent })
      setSelectedStudent(propsStudent)
    }
    if (propsPackage) {
      form.setFieldsValue({ package: propsPackage })
    }
  }, [propsStudent, propsPackage, form])

  useEffect(() => {
    if (visible) {
      setLoading(true)
      const promises: Promise<any>[] = []

      if (loadStudents) {
        promises.push(dispatch(fetchStudents({})))
      }
      if (loadPackages) {
        promises.push(dispatch(fetchTutoringPackages({})))
      }
      Promise.all(promises)
        .then(() => setLoading(false))
        .catch(e => {
          setLoading(false)
          message.error('Failed to retrieve data')
          dispatch(closeModal())
        })
    }
  }, [dispatch, loadPackages, loadStudents, visible])

  const onPackageChange = (packagePK: number) => {
    const newPackage = packages.find(p => p.pk === packagePK)
    form.setFieldsValue({ price: newPackage?.price })
  }

  /**
   * We create our tutoring package purchase
   * @param values Form Fields (FormFields type)
   */
  const submit = (values: Store) => {
    const data: CreateTutoringPackagePurchasePayload = {
      student: values.student,
      tutoring_package: values.package,
      price_paid: values.price,
      admin_note: values.admin_note,
      execute_charge: false,
    }
    setSaving(true)
    dispatch(createTutoringPackagePurchase(data))
      .then(() => {
        message.success('Purchase created')
        dispatch(closeModal())
      })
      .catch(e => message.error(`Failed to create purchase: ${e}`))
      .finally(() => setSaving(false))
  }

  const renderFormContent = () => {
    const selectedStudentObject = students.find(s => s.pk === selectedStudent)
    const studentLocation = selectedStudentObject?.location
    const availablePackages = packages.filter(
      p => p.all_locations || (studentLocation && p.locations.includes(studentLocation as number)),
    )

    return (
      <>
        {!modalProps?.hideStudent && (
          <Form.Item label="Student" name="student" rules={[{ required: true }]}>
            <Select value={selectedStudent} onChange={setSelectedStudent}>
              {students.map(s => (
                <Select.Option key={s.pk} value={s.pk}>
                  {getFullName(s)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}
        <Form.Item noStyle shouldUpdate={() => true}>
          {({ getFieldValue }) => {
            return getFieldValue('student') ? (
              <Form.Item label="Package" name="package" rules={[{ required: true }]}>
                <Select
                  disabled={!getFieldValue('student')}
                  showSearch={true}
                  optionFilterProp="filter"
                  onChange={onPackageChange}
                >
                  {availablePackages.map(s => (
                    <Select.Option filter={s.title} key={s.pk} value={s.pk} className={styles.selectPackageOption}>
                      <p className="title">{s.title}</p>
                      <p className="hours">
                        <strong>Test Prep:</strong>
                        {s.individual_test_prep_hours} individual hours; {s.group_test_prep_hours} group hours
                        <br />
                        <strong>Curriculum:</strong>
                        {s.individual_curriculum_hours} individual hours
                      </p>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            ) : null
          }}
        </Form.Item>
        {isAdmin && (
          <>
            <Form.Item
              extra="Enter the price paid for this package. This is for reporting purposes only. User will not be charged"
              label="Price"
              name="price"
              rules={[{ required: true }]}
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item extra="Optional note. Only visible to admins." label="Note" name="admin_note">
              <Input.TextArea />
            </Form.Item>
          </>
        )}
      </>
    )
  }

  return (
    <Modal
      forceRender
      visible={visible}
      onOk={() => form.submit()}
      onCancel={e => {
        dispatch(closeModal())
      }}
      okText="Submit"
      confirmLoading={saving}
      title="Create Tutoring Package Purchase"
    >
      {loading && <Skeleton />}
      <Form form={form} {...layout} name="createTutoringPackagePurchase" onFinish={submit}>
        {!loading && renderFormContent()}
      </Form>
    </Modal>
  )
}
