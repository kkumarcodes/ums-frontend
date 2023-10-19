// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { Row, Button, Popconfirm, Tag } from 'antd'
import moment from 'moment-timezone'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { TutorTimeCardLineItem } from 'store/tutoring/tutoringTypes'
import { deleteTimeCardLineItem } from 'store/tutoring/tutoringThunks'
import { handleSuccess } from 'components/administrator'
import { useReduxDispatch } from 'store/store'

// pk is timeCardPK
type Props = {
  pk: number
  entity: TutorTimeCardLineItem
  setIsEditing: React.Dispatch<React.SetStateAction<string>>
}

/**
 * Renders a lineItem item
 * @param pk timeCardPK
 * @param entity current lineItem
 * @param setIsEditing determines if lineItem is in edit state
 */
export const TimeCardLineItem = ({ pk, entity, setIsEditing }: Props) => {
  const dispatch = useReduxDispatch()

  const handleDelete = (timeCardLineItemPK: number) => {
    dispatch(deleteTimeCardLineItem(pk as number, timeCardLineItemPK)).then(() => {
      handleSuccess('Line item deleted')
    })
  }

  // Renders datetime display for line item. We show time for line items associated with sessions
  // otherwise we just show the date
  const renderDatetime = (lineItem: TutorTimeCardLineItem) => {
    return lineItem.group_tutoring_session || lineItem.individual_tutoring_session
      ? moment(entity.date).tz(moment.tz.guess()).format('MMM Do h:mma z')
      : moment(entity.date).format('MMM Do')
  }

  return (
    <Row key={entity.slug} className="lineItemDetailsList">
      <div className="item itemDate">{renderDatetime(entity)}</div>
      <div className="item itemTitle">
        {entity.title}
        {entity.category && entity.category !== 'Tutoring' && (
          <>
            <br />
            <Tag>{entity.category}</Tag>
          </>
        )}
      </div>
      <div className="item itemHours">{entity.hours}</div>
      <Row className="item itemActions buttonWrapperActions">
        <Button
          className="editButton"
          onClick={() => {
            setIsEditing(entity.slug)
          }}
        >
          <EditOutlined />
        </Button>
        <Popconfirm title="Delete record?" onConfirm={() => handleDelete(entity.pk)}>
          <Button>
            <DeleteOutlined />
          </Button>
        </Popconfirm>
      </Row>
    </Row>
  )
}
