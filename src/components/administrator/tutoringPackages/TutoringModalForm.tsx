// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Modal } from 'antd'
import { WrappedTextInput } from 'components/common/FormItems'
import React, { useEffect, useState } from 'react'
import { TutoringPackage } from 'store/tutoring/tutoringTypes'
import styles from './styles/TutoringPackageList.scss'

interface TutoringModalFormComponentProps {
  visible: boolean
  onCreate: (values: Values) => void
  onCancel: () => void
  fields: Partial<TutoringPackage>
  okText: string
  title: string
}

const TutoringModalFormComponent = ({ title, okText, visible, onCancel, onCreate, packageData }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (packageData?.pk) {
      form.setFieldsValue(packageData)
    }
  }, [packageData])

  const confirmChange = () => {
    form
      .validateFields()
      .then(values => {
        form.resetFields()

        const updated_data = { ...values }
        updated_data['pk'] = packageData.pk
        onCreate(updated_data)
      })
      .catch(info => {})
  }

  return (
    <Modal
      visible={visible}
      title={title}
      okText={okText}
      onCancel={onCancel}
      onOk={() => {
        confirmChange()
      }}
    >
      <Form initialValues={packageData} layout="vertical" form={form} onFinish={onCreate} className="form-3-col">
        <WrappedTextInput name="title" label="Title " isRequired={false} wrapperCN={styles.antFormItem} />
        <WrappedTextInput name="sku" label="SKU " isRequired={false} wrapperCN={styles.antFormItem} />
        <WrappedTextInput name="product_id" label="Product ID " isRequired={false} wrapperCN={styles.antFormItem} />
        <WrappedTextInput
          name="magento_purchase_link"
          label="Payment Link "
          isRequired={false}
          wrapperCN={styles.antFormItem}
        />
      </Form>
    </Modal>
  )
}

export default TutoringModalFormComponent
