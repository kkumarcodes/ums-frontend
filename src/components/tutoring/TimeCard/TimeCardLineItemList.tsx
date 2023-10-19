// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Row } from 'antd'
import { handleSuccess } from 'components/administrator'
import styles from 'components/tutoring/styles/TimeCard.scss'
import { TimeCardLineItem, TimeCardLineItemEdit } from 'components/tutoring/TimeCard'
import { isEmpty, sortBy } from 'lodash'
import React, { useState } from 'react'
import { useReduxDispatch } from 'store/store'
import { updateTimeCardLineItem } from 'store/tutoring/tutoringThunks'
import { TutorTimeCardLineItem } from 'store/tutoring/tutoringTypes'
import moment from 'moment'

// pk => timeCardPK
type Props = {
  pk?: number
  lineItems?: TutorTimeCardLineItem[]
}

/**
 * Component render lineItem list. Used in LineItemForm.
 * LineItems are either in TimeCardLineItem or TimeCardLineItemEdit components (if isEditing === ele.slug)
 * @param pk timeCardPK
 * @param lineItems list of line items associated with timeCard
 */
export const TimeCardLineItemList = ({ pk, lineItems = [] }: Props) => {
  const dispatch = useReduxDispatch()

  const [isEditing, setIsEditing] = useState('')

  const handleUpdate = (timeCardLineItemPK: number, payload: Partial<TutorTimeCardLineItem>) => {
    dispatch(updateTimeCardLineItem(pk as number, timeCardLineItemPK, payload)).then(() => {
      setIsEditing('')
      handleSuccess('Time card line item updated')
    })
  }
  return (
    <div className={styles.containerList}>
      {!isEmpty(lineItems) && (
        <>
          <h3 className="headerTitle">Line Items:</h3>
          <Row className="headerList">
            <div className="item itemDate">Date</div>
            <div className="item itemTitle">Title</div>
            <div className="item itemHours">Hours</div>
            <div className="item itemActions">Actions</div>
          </Row>
        </>
      )}
      {isEmpty(lineItems) && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <img width="50%" style={{ padding: 10 }} src="/static/cwcommon/empty.png" alt="no records found" />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
            No line items found
          </div>
        </div>
      )}
      {sortBy(lineItems, ele => moment(ele.date).valueOf())?.map(ele =>
        isEditing === ele.slug ? (
          <TimeCardLineItemEdit
            pk={pk as number}
            key={ele.slug}
            handleUpdate={handleUpdate}
            setIsEditing={setIsEditing}
            entity={ele}
          />
        ) : (
          <TimeCardLineItem pk={pk as number} key={ele.slug} setIsEditing={setIsEditing} entity={ele} />
        ),
      )}
    </div>
  )
}
