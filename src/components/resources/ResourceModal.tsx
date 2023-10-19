// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, message, Select } from 'antd'

import Modal from 'antd/lib/modal/Modal'
import { WrappedFormControl, WrappedTextInput } from 'components/common/FormItems'
import MultiFileUpload, { MultiFileUploadMode } from 'components/common/MultiFileUpload'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FileUpload } from 'store/common/commonTypes'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { MODALS, ResourceModalProps } from 'store/display/displayTypes'
import { selectResource, selectResourceGroups } from 'store/resource/resourcesSelectors'
import { createResource, updateResource } from 'store/resource/resourcesThunks'
import { PostResource } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'
import { selectStudent } from 'store/user/usersSelector'
import { updateStudent } from 'store/user/usersThunks'
import styles from './styles/ResourceModal.scss'

const ResourceModal = () => {
  const [loading, setLoading] = useState(false)
  const visible = useSelector(selectVisibleModal(MODALS.RESOURCE_MODAL))
  const [fileUploads, setFileUploads] = useState<Partial<FileUpload> & { slug: string }[]>([])

  const dispatch = useReduxDispatch()
  const [form] = Form.useForm();
  const props = useSelector(selectVisibleModalProps(MODALS.RESOURCE_MODAL)) as ResourceModalProps
  const editResource = useSelector(selectResource(props?.resourceID))
  const propStudent = useSelector(selectStudent(props?.studentID))
  const resourceGroups = useSelector(selectResourceGroups)

  const propResourceGroupID = props?.resourceGroupID
  useEffect(() => {
    if (visible) {
      if (editResource) {
        form.setFieldsValue(editResource)
        setFileUploads([{ slug: editResource.resource_file, title: editResource.title }])
      } else {
        form.resetFields()
        if (propResourceGroupID) form.setFieldsValue({ resource_group: propResourceGroupID })
        setFileUploads([])
      }
    }
  }, [visible, editResource, form, propResourceGroupID])

  // Create/Save our resource!
  const editResourcePK = editResource?.pk
  const propStudentResources = propStudent?.visible_resources ?? []
  const propStudentPK = props?.studentID
  const onSubmit = useCallback(async () => {
    await form.validateFields()
    setLoading(true)
    const data: Partial<PostResource> = form.getFieldsValue()
    if (fileUploads.length) data.file_upload = fileUploads[0].slug
    else data.file_upload = ''

    try {
      const resource = editResourcePK
        ? await dispatch(updateResource(editResourcePK, data))
        : await dispatch(createResource(data))

      // If a student was set in our props, then we are to make this resource visible to student
      if (propStudentPK)
        await dispatch(updateStudent(propStudentPK, { visible_resources: [...propStudentResources, resource.pk] }))

      form.resetFields()
      dispatch(closeModal())
    } catch (err) {
      message.warn('Could not save resource')
    } finally {
      setLoading(false)
    }
  }, [dispatch, editResourcePK, fileUploads, form, propStudentPK, propStudentResources])

  return (
    <Modal className={styles.resourceModal} visible={visible} footer={null} onCancel={() => dispatch(closeModal())}>
      <Form layout="vertical" name="resource" form={form}>
        <WrappedTextInput name="title" label="Title" isRequired={true} />
        <WrappedTextInput name="description" label="Description" />
        <Form.Item name="resource_group" label="Resource Group">
          <Select
            options={resourceGroups.map(rg => ({ value: rg.pk, label: rg.title }))}
            allowClear
            showSearch
            optionFilterProp="children"
          />
        </Form.Item>
        <WrappedTextInput name="link" label="Link to Resource or Attach File" allowClear />
        <MultiFileUpload mode={MultiFileUploadMode.Button} value={fileUploads} onChange={setFileUploads} maxFiles={1} />
        <WrappedFormControl onCancel={() => dispatch(closeModal())} onSubmit={onSubmit} loading={loading} />
      </Form>
    </Modal>
  )
}
export default ResourceModal
