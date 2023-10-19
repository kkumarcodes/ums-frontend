// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Checkbox, Form } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { WrappedFormControl, WrappedPersonSelect, WrappedRangePicker } from 'components/common/FormItems'
import styles from 'components/tutoring/styles/TimeCard.scss'
import { Views } from 'components/tutoring/TimeCard'
import { useShallowSelector } from 'libs'
import { map } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { closeModal, showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { createTimeCard, fetchTimeCard, updateTimeCard } from 'store/tutoring/tutoringThunks'
import { selectTutors } from 'store/user/usersSelector'

moment.locale('en-gb')

const now = moment()

// If current day is a Monday, return 7 instead of 0. Otherwise return days since Monday.
const daysSinceLastMonday = now.day() ? now.day() : 7

type Props = {
  pk?: number
  setActiveView: any
}
/**
 * Renders a TimeCard Create/Edit form
 * @param pk timeCardPK
 * @param handleCancel Closes modal
 * @param setActiveView Changes modal activeView
 */
export const TimeCardForm = ({ pk, setActiveView }: Props) => {
  const [form] = Form.useForm()
  const { setFieldsValue } = form
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useReduxDispatch()
  const tutors = useSelector(selectTutors)
  const timeCard = useShallowSelector((state: RootState) => (pk ? state.tutoring.timeCards[pk] : null))
  const [allTutors, setAllTutors] = useState(false)
  const start = timeCard?.start
  const end = timeCard?.end
  const tutor = timeCard?.tutor

  useEffect(() => {
    if (pk && !start) {
      setLoading(true)
      dispatch(fetchTimeCard(pk))
        .then(() => {
          setFieldsValue({
            dates: [moment(start), moment(end)],
            tutor,
          })
        })
        .finally(() => setLoading(false))
    }
  }, [dispatch, end, pk, setFieldsValue, start, tutor])

  const handleFinish = async (values: Store) => {
    const payload = {
      start: values?.dates[0].toISOString(),
      end: values?.dates[1].toISOString(),
      tutors: allTutors ? map(tutors, 'pk') : [values?.tutor],
    }

    setLoading(true)
    setError(null)
    try {
      if (pk) {
        await dispatch(updateTimeCard(pk, { start: payload.start, end: payload.end }))
      } else {
        await dispatch(createTimeCard(payload)).then(data => {
          if (data.length === 1) {
            dispatch(showModal({ props: { pk: data[0].pk }, modal: MODALS.TIME_CARD }))
            setActiveView(Views.LineItem)
          } else {
            dispatch(closeModal())
          }
        })
      }
    } catch (err) {
      if (allTutors) {
        setError('Error creating time card')
      } else {
        setError('Error creating time card. Please confirm that time card does not overlap with existing time card.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.containerForm}>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{
          dates: pk
            ? [moment(start), moment(end)]
            : [moment().subtract(daysSinceLastMonday + 7, 'd'), moment().subtract(daysSinceLastMonday + 1, 'd')],
          tutor: timeCard?.tutor,
        }}
        className="form"
      >
        <WrappedRangePicker name="dates" label="Time Card" />
        <WrappedPersonSelect disabled={allTutors} name="tutor" isRequired={false} label="Tutor" entities={tutors} />
        <Form.Item
          name="all_tutors"
          label="All Tutors"
          help="Check to create time cards for all tutors. Note that time cards cannot overlap, so if a tutor already has a time card covering the specified date range, a new time card will note be created"
        >
          <Checkbox onChange={e => setAllTutors(e.target.checked)} checked={allTutors} />
        </Form.Item>
        <div className="errorMessage">{error}</div>
        <WrappedFormControl loading={loading} />
      </Form>
    </div>
  )
}
