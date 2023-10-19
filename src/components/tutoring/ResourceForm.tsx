// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Row } from 'antd'
import { handleError, handleSuccess, getFullName } from 'components/administrator'
import { WrappedFormControl, WrappedSingleUpload, WrappedTextInput, WrappedSwitch } from 'components/common/FormItems'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { closeModal } from 'store/display/displaySlice'
import {
  createResource,
  createResourceGroup,
  updateResource,
  updateResourceGroup,
} from 'store/resource/resourcesThunks'
import { Resource, ResourceGroup } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsAdmin } from 'store/user/usersSelector'
import { WrappedGenericSelect } from 'components/common/FormItems/WrappedGenericSelect'
import { selectResourceGroups } from 'store/resource/resourcesSelectors'
import { RootState } from 'store/rootReducer'
import { updateStudent } from 'store/user/usersThunks'

type Error = {
  non_field_errors: string[]
}

type Props = {
  id?: number
  isResource: boolean
  entity: Resource | ResourceGroup | null
  studentID?: number // Optional ID of student we create resource for
}
export const ResourceForm = ({ isResource, id, studentID, entity }: Props) => {
  const [form] = Form.useForm()
  const { setFieldsValue } = form

  const initialValues = {
    title: '',
    description: '',
    public: false,
    is_stock: false,
    link: '',
    fileList: [],
  }

  const isAdmin = useSelector(selectIsAdmin)
  const resourceGroups = useSelector(selectResourceGroups).filter(rg => !rg.public)

  const dispatch = useReduxDispatch()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isDisabled, setDisabled] = useState(false)
  const student = useSelector((state: RootState) => (studentID ? state.user.students[studentID] : null))

  // If entity exist => we are editing => set initialValues
  useEffect(() => {
    if (entity) {
      if (isResource) {
        // If resource_file exist, this entity was a resource with a file upload
        // Grab file name to display to user as upload preview
        const fileList = (entity as Resource).resource_file
          ? [
              {
                uid: entity.slug,
                name: (entity as Resource).resource_file.split('/')[
                  (entity as Resource).resource_file.split('/')?.length - 1
                ],
                url: (entity as Resource).url,
                status: 'done',
              },
            ]
          : []

        setFieldsValue({
          title: entity.title,
          description: entity.description,
          public: entity.public,
          resource_group: (entity as Resource).resource_group,
          is_stock: (entity as Resource).is_stock,
          link: (entity as Resource).link,
          fileList,
          add_to_student: true,
        })
      } else {
        setFieldsValue({
          title: entity.title,
          description: entity.description,
          public: entity.public,
          add_to_student: true,
        })
      }
    }
  }, [entity, isResource, setFieldsValue])

  const handleFinish = async (values: any) => {
    setLoading(true)
    // Prevent user from submitting a file and link
    if (values.link && values.fileList?.length) {
      setError({
        non_field_errors: ["Resource can't contain both a file and a link. Delete one."],
      })
      setLoading(false)
      return
    }
    // A user must submit either a link or a file when creating a resource
    if (!values.link && !values.fileList?.length) {
      setError({
        non_field_errors: ['Resource must contain either a file or a link'],
      })
      setLoading(false)
      return
    }

    try {
      const resourceEntity = values
      if (isAdmin && isResource) resourceEntity.is_stock = true

      const payload = { ...values }
      if (isAdmin && isResource) payload.is_stock = true
      if (isResource) {
        // If response.slug exist, then this is a newly selected file update => initiate file_upload
        // A previously attached file on a resource will not have a response.slug field
        if (values.fileList[0]?.response?.slug) {
          payload.file_upload = values.fileList[0]?.response.slug
        }
        // We delete the fileList array before submission (backend doesn't care about this field)
        delete payload.fileList

        // If link field is blank (e.g. submiting a file); delete field => prevents no blank error from server
        if (!payload.link) {
          delete payload.link
        }
        // If resource_group field is blank (e.g. submiting a file); delete field => prevents no blank error from server
        if (!payload.resource_group) {
          delete payload.resource_group
        }

        let addStudent
        if (student?.pk && payload.add_to_student) {
          addStudent = student.pk
          delete payload.add_to_student
        }

        // If id is defined, we are editing, otherwise creating resource/resourceGroup
        const resource = await dispatch(id ? updateResource(id, payload) : createResource(payload))
        if (addStudent) {
          await dispatch(updateStudent(addStudent, { visible_resources: [...student.visible_resources, resource.pk] }))
        }
      } else {
        await dispatch(id ? updateResourceGroup(id, payload) : createResourceGroup(payload))
      }
      handleSuccess(`${isResource ? 'Resource' : 'Resource group'} ${id ? 'updated!' : 'created!'}`)
      dispatch(closeModal())
    } catch (err) {
      handleError(`Failed to ${id ? 'update' : 'create'} ${isResource ? 'resource' : 'resource group'}`)
      setError(err?.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const showisStock = isAdmin && !isResource

  return (
    <Form layout="vertical" name="resource" form={form} initialValues={initialValues} onFinish={handleFinish}>
      <WrappedTextInput name="title" label="Title" isRequired={true} />
      <WrappedTextInput name="description" label="Description" />
      {isAdmin && (
        <WrappedGenericSelect
          isRequired={false}
          name="resource_group"
          label="Resource Group"
          entities={resourceGroups}
          propToDisplay="title"
        />
      )}
      {showisStock && (
        // Can we remove AccessSwitch from this form? It has display: none via switchAccess className
        <Row>
          <WrappedSwitch
            name="access"
            label="Access"
            checkedChildren="Public"
            unCheckedChildren="Private"
            wrapperCN="switchAccess"
            disabled
          />
          {isResource && (
            <WrappedSwitch name="is_stock" label="Is Stock?" checkedChildren="Stock" unCheckedChildren="Not Stock" />
          )}
        </Row>
      )}
      {isResource && (
        <>
          {/* We hide link field if this was a file resource. Server can't switch a resource from file to link. */}
          {!(entity as Resource)?.resource_file && (
            <WrappedTextInput
              name="link"
              label="Resource Link"
              placeholder="https://www.google.com"
              rules={[
                {
                  type: 'url',
                  message: 'Must be a valid URL, with scheme (e.g. https:// or http://)',
                },
              ]}
              validateOnBlur={true}
              allowClear
            />
          )}
          {/* setFieldsValue is needed to allow WrappedSingleUpload to overide default upload form item behavior */}
          <WrappedSingleUpload
            action="/cw/upload/"
            name="fileList"
            label="Upload File"
            setFieldsValue={setFieldsValue}
            setDisabled={setDisabled}
          />
        </>
      )}
      {isResource && student?.pk && (
        <WrappedSwitch defaultChecked name="add_to_student" label={`Make visible to ${getFullName(student)}`} />
      )}
      <div className="center error">{error?.non_field_errors}</div>
      <WrappedFormControl loading={loading} disabled={isDisabled} />
    </Form>
  )
}
