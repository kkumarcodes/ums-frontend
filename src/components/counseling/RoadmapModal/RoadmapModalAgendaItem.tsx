// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { RefObject } from 'react'
import _, { each, filter, toPairs } from 'lodash'

import { AgendaItemTemplate, CounselorMeetingTemplate } from 'store/counseling/counselingTypes'
import { Button, Dropdown, Menu, Tooltip } from 'antd'
import { CloseCircleOutlined, FullscreenOutlined, PlusCircleOutlined, SubnodeOutlined } from '@ant-design/icons'
import { DraggableProvided } from 'react-beautiful-dnd'
import styles from './styles/RoadmapModal.scss'

type Props = {
  agendaItemTemplate?: AgendaItemTemplate
  customAgendaItem?: string
  include: boolean // Whether or not the agenda item is to be included
  onSetInclude: (included: boolean) => void
  availableMeetings: CounselorMeetingTemplate[] // Meetings that agenda items from this meeting can be moved to
  onMoveAgendaItem: (meetingTemplate: number) => void
  provided?: DraggableProvided
  innerRef?: string | ((instance: HTMLDivElement | null) => void) | RefObject<HTMLDivElement> | null | undefined
  isDragging: boolean
}

const RoadmapModalAgendaItem = ({
  agendaItemTemplate,
  customAgendaItem,
  include,
  onSetInclude,
  availableMeetings,
  onMoveAgendaItem,
  provided,
  innerRef,
  isDragging,
}: Props) => {
  // We need all of the meetings that are being included

  const menu = (
    <Menu onClick={v => onMoveAgendaItem(Number(v.key))}>
      {availableMeetings.map(m => (
        <Menu.Item key={m.pk}>{m.title}</Menu.Item>
      ))}
    </Menu>
  )

  return (
    <div
      className={`roadmap-agenda-item ${styles.roadmapModalAgendaItem} ${isDragging ? 'drag' : ''}`}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={innerRef}
    >
      <Button
        shape="circle"
        type="link"
        className="removeitem"
        icon={include ? <CloseCircleOutlined /> : <PlusCircleOutlined />}
        onClick={() => onSetInclude(!include)}
      />
      <span className={!include ? 'exclude' : ''}>{agendaItemTemplate?.counselor_title || customAgendaItem}</span>
      <Dropdown trigger={['click']} overlay={menu}>
        <Tooltip title="Move to another meeting...">
          <Button shape="circle" type="link" className="move-item" icon={<FullscreenOutlined />} />
        </Tooltip>
      </Dropdown>
    </div>
  )
}
export default RoadmapModalAgendaItem
