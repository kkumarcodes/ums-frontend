// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState } from 'react'
import { Form } from 'antd'
import { WrappedTextInput, WrappedEntitySelect, WrappedFormControl } from 'components/common/FormItems'
import { values } from 'lodash'
import { Store } from 'antd/lib/form/interface'
import { useReduxDispatch } from 'store/store'
import { updateCourse } from 'store/tutoring/tutoringThunks'
import { closeModal } from 'store/display/displaySlice'
import { Course, Categories } from 'store/tutoring/tutoringTypes'
import { handleSuccess, handleError } from 'components/administrator'

type Props = {
  course: Course
}

export const CourseForm = ({ course }: Props) => {
  const dispatch = useReduxDispatch()

  const [loading, setLoading] = useState(false)

  const handleFinish = (values: Store) => {
    setLoading(true)
    dispatch(updateCourse(course.pk, values))
      .then(() => {
        handleSuccess('Course updated')
        dispatch(closeModal())
      })
      .catch(err => handleError('Course failed to update'))
      .finally(() => setLoading(false))
  }

  const initialValues = {
    name: course.name,
    description: course.description,
    category: course.category,
  }

  return (
    <Form layout="vertical" onFinish={handleFinish} initialValues={initialValues}>
      <WrappedTextInput label="Course Name" name="name" />
      <WrappedTextInput label="Course Description" name="description" isTextArea={true} />
      <WrappedEntitySelect label="Course Category" name="category" entities={values(Categories)} />
      <WrappedFormControl loading={loading} />
    </Form>
  )
}
