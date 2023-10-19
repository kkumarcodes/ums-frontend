// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Input, message, Select } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import Row from 'antd/lib/row'
import { getFullName } from 'components/administrator'
import { WrappedSingleUpload } from 'components/common/FormItems'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FileUpload } from 'store/common/commonTypes'
import { updateCounselingFileUpload } from 'store/counseling/counselingThunks'
import { CounselingUploadFileTags } from 'store/counseling/counselingTypes'
import { selectActiveModal, selectVisibleModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CounselingFileUploadProps, MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import API from 'store/api'
import styles from './styles/CFUModal.scss'

const CounselingFileUploadModal = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const [form] = Form.useForm();
  const { setFieldsValue } = form

  const visible = useSelector(selectVisibleModal(MODALS.COUNSELING_FILE_UPLOAD))
  const props: CounselingFileUploadProps = useSelector(selectActiveModal)?.modalProps as CounselingFileUploadProps
  const studentName = useSelector((state: RootState) =>
    visible && props ? getFullName(state.user.students[props.studentID]) : '',
  )

  const existingFileUpload = useSelector((state: RootState) =>
    props?.editFileUploadSlug ? state.counseling.counselingFileUploads[props.editFileUploadSlug] : null,
  )

  const initialValues = {
    title: '',
    url: '',
    file_upload: [],
    tags: [],
  }

  const reset = useCallback(() => form.setFieldsValue(initialValues), []) // eslint-disable-line react-hooks/exhaustive-deps

  /** When modal becomes visible, we set files value */
  useEffect(() => {
    if (visible) {
      if (existingFileUpload) {
        form.setFieldsValue(existingFileUpload)
      } else {
        reset()
      }
    }
  }, [existingFileUpload, form, reset, visible])

  /** When filter tags on props change, we update our select */
  const tags = props?.tags || []
  useEffect(() => {
    if (visible && tags) {
      form.setFieldsValue({ tags })
    }
  }, [visible, tags, form])

  /**
   * Let's goooo!
   * Note that submitting doesn't actually create the FileUpload. It will already exist. So we just update it
   * to have the correct data
   */
  const submit = async () => {
    // The `title` field is the only form controlled validation that is being checked below:
    try {
      await form.validateFields()
    } catch (err) {
      console.log(err)
      return false
    }
    const values = form.getFieldsValue()

    // Let's check if we are trying to upload a file AND a link:
    if (values.file_upload?.length && values.url) {
      message.error('Uploading both a file and a link is not allowed. Please delete one and try again.')
      return false
    }

    // Are we uploading a link (not a file)? Then we need to create the file upload slug
    let linkSlug: null | string = null
    if (values.title && values.url && !values.file_upload.length) {
      const { data } = await API.post('/cw/upload/', { link: { name: values.title, url: values.url } })
      linkSlug = data?.slug
    }

    // Let's set the slug and the student we are uploading for:
    const data: Partial<FileUpload> & { counseling_student: number; slug: string } = {
      ...values,
      slug: props?.editFileUploadSlug || linkSlug || values.file_upload[0]?.response?.slug,
      counseling_student: props.studentID,
    }

    setLoading(true)
    dispatch(updateCounselingFileUpload(data))
      .then(() => {
        reset()
        dispatch(closeModal())
      })
      .catch(e => {
        console.warn(e)
        message.error('Failed to create file upload')
      })
      .finally(() => setLoading(false))
    return true
  }

  return (
    <Modal
      onOk={submit}
      onCancel={() => dispatch(closeModal())}
      className={styles.cfuModal}
      visible={visible}
      title={`Upload Files for ${studentName}`}
      confirmLoading={loading}
      okText="Save File"
    >
      <Form form={form} initialValues={initialValues}>
        {!existingFileUpload && (
          <>
            <Row>
              <WrappedSingleUpload
                action="/cw/upload/"
                name="file_upload"
                label="Upload File"
                wrapperCN="ant-upload"
                setFieldsValue={setFieldsValue}
              />
            </Row>
            <Row justify="center">or</Row>
            <br />
            <Row>
              <Form.Item label="Document link" name="url">
                <Input />
              </Form.Item>
            </Row>
            <hr />
            <br />
          </>
        )}

        <Row>
          <Form.Item label="Title" name="title" required rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Row>
        <Row>
          <Form.Item label="Tags" name="tags">
            <Select mode="multiple">
              {Object.values(CounselingUploadFileTags).map(t => (
                <Select.Option value={t} key={t}>
                  {t}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Row>
      </Form>
    </Modal>
  )
}
export default CounselingFileUploadModal
