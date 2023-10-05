// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { useReduxDispatch } from 'store/store'
import { selectVisibleCourseModal, selectActiveModal } from 'store/display/displaySelectors'
import { CourseModalProps } from 'store/display/displayTypes'
import { Modal } from 'antd'
import { closeModal } from 'store/display/displaySlice'
import { useSelector } from 'react-redux'
import { CourseForm } from 'components/administrator/course/CourseForm'

export const CourseModal = () => {
  const dispatch = useReduxDispatch()

  const visible = useSelector(selectVisibleCourseModal)
  const props = useSelector(selectActiveModal)?.modalProps as CourseModalProps

  return (
    <Modal
      wrapClassName="containerModal"
      title="Edit Course"
      visible={visible}
      onCancel={() => dispatch(closeModal())}
      footer={false}
      destroyOnClose
    >
      <CourseForm course={props?.course} />
    </Modal>
  )
}
