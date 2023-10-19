// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { Table, Row, Checkbox, Select, message } from 'antd'
import { TableProps } from 'antd/lib/table'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { selectRoadmaps } from 'store/counseling/counselingSelectors'
import { selectAgendaItemTemplates } from 'store/counseling/counselingSelectors'
import { selectTaskTemplate } from 'store/task/tasksSelectors'
import { updateTaskTemplate } from 'store/task/tasksThunks'
import { Roadmap } from 'store/counseling/counselingTypes'
import { renderHighlighter } from 'components/administrator/helpers'
import { sortString } from '../utils'

const { Option, OptGroup } = Select

/**@meetingTemplateID is the PK for the the CounselorMeetingTemplate */

type Props = {
  taskTemplateID: number
}

export interface OptionItem {
  pk: number
  name: string
  disabled: boolean
}

/**Componet that renders the expanded row for each CounselorMeetingTemplate on the CounselorMeetingTemplateTable */

export const TaskTemplateExpandedRow = ({ taskTemplateID }: Props) => {
  const dispatch = useReduxDispatch()
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const roadmaps = useSelector(selectRoadmaps)
  const [agendaItemTemplateData, setAgendaItemTemplateData] = useState<Array<number>>([])
  const agendaItemTemplates = useSelector(selectAgendaItemTemplates())

  const editTaskTemplate = useSelector(selectTaskTemplate(taskTemplateID))

  useEffect(() => {
    if (taskTemplateID && editTaskTemplate) {
      setAgendaItemTemplateData(editTaskTemplate.pre_agenda_item_templates)
    }
  }, [taskTemplateID]) // eslint-disable-line react-hooks/exhaustive-deps

  const tableProps: TableProps<Roadmap> = {
    rowKey: 'slug',
    showHeader: true,
    className: 'roadmapTable',
    expandRowByClick: true,
  }

  const renderTitle = (text: string, record: Roadmap) => {
    let name: string
    name = record?.title
    return <span>{renderHighlighter(name, search)}</span>
  }

  const renderAgendaItem = (text: string, record: Roadmap) => {
    let agendaItem: string = ''
    record.counselor_meeting_templates.forEach(counselor_meeting_template => {
      counselor_meeting_template.agenda_item_templates.forEach(agenda => {
        if (agendaItemTemplateData.some(el => el === agenda.pk)) {
          let meetings: string[] = []
          record.counselor_meeting_templates.forEach(c => {
            const findItem = c.agenda_item_templates.some(a => a.pk === agenda.pk)

            if (findItem) {
              meetings.push(counselor_meeting_template.title)
            }
          })

          agendaItem = `${agenda.counselor_title} (${meetings.toString()})`
        }
      })
    })

    return <span>{agendaItem.toString()}</span>
  }
  const renderActions = (text: string, record: Roadmap) => {
    return (
      <Row>
        <Checkbox checked={true} onChange={e => unassignAgenda(record)}></Checkbox>
      </Row>
    )
  }
  const columns = [
    {
      title: 'Roadmap',
      dataIndex: 'name',
      render: renderTitle,
      sorter: (a: Roadmap, b: Roadmap) => sortString(a.title, b.title),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Agenda Item',
      dataIndex: '#',
      render: renderAgendaItem,
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Assigned',
      dataIndex: 'actions',
      render: renderActions,
    },
  ]

  //searches roadmap titles
  const handleFilter = (roadmaps: Roadmap[]) => {
    return roadmaps.filter(roadmap => {
      return roadmap.counselor_meeting_templates.some(counselor_meeting_template => {
        return counselor_meeting_template.agenda_item_templates.some(agenda =>
          agendaItemTemplateData.some(el => el === agenda.pk),
        )
      })
    })
  }

  const unassignAgenda = (roadmap: Roadmap) => {
    let agendaItem: number = -1
    roadmap.counselor_meeting_templates.some(counselor_meeting_template => {
      return counselor_meeting_template.agenda_item_templates.some(agenda => {
        if (agendaItemTemplateData.some(el => el === agenda.pk)) {
          agendaItem = agenda.pk
          return true
        }
        return false
      })
    })

    if (agendaItem !== -1) {
      const newData = agendaItemTemplateData.filter(el => el !== agendaItem)
      setAgendaItemTemplateData(newData)
      onSubmit(newData)
    }
  }

  const handleChange = (value: number) => {
    const newData = [...agendaItemTemplateData, value]
    setAgendaItemTemplateData(newData)
    onSubmit(newData)
  }

  const onSubmit = async (filtered: number[]) => {
    setSaving(true)
    let taskTemplate = { ...editTaskTemplate }
    taskTemplate.pre_agenda_item_templates = filtered
    try {
      // Editing (editing counselor created custom task template)
      await dispatch(updateTaskTemplate({ ...taskTemplate, pk: taskTemplateID }))
    } catch {
      message.warn('Failed to save task template')
    } finally {
      setSaving(false)
    }
  }

  const getOptionItems = (roadmap: Roadmap) => {
    let items: OptionItem[] = []
    let hasSameRoadmap = false
    agendaItemTemplates.forEach(agendaItemTemplate => {
      let findAgenda = false
      let meetings: string[] = []
      roadmap.counselor_meeting_templates.forEach(counselor_meeting_template => {
        const findItem = counselor_meeting_template.agenda_item_templates.some(
          agenda => agenda.pk === agendaItemTemplate.pk,
        )

        if (findItem) {
          findAgenda = true
          meetings.push(counselor_meeting_template.title)
        }
      })

      if (findAgenda) {
        items.push({
          pk: agendaItemTemplate.pk,
          name: `${agendaItemTemplate.counselor_title} (${meetings.toString()})`,
          disabled: false,
        })
        if (agendaItemTemplateData.some(el => el === agendaItemTemplate.pk)) {
          hasSameRoadmap = true
        }
      }
    })
    if (hasSameRoadmap) {
      items = items.map(item => {
        return {
          ...item,
          disabled: true,
        }
      })
    }

    return items
  }

  return (
    <div>
      <div className="wisernet-toolbar">
        <Select
          showSearch
          optionFilterProp="label"
          onChange={handleChange}
          allowClear
          style={{ width: '100%' }}
          placeholder="Search to Select"
          value=""
        >
          {roadmaps.map(roadmap => {
            return (
              <OptGroup label={roadmap.title} key={roadmap.pk}>
                {getOptionItems(roadmap).map(item => {
                  return (
                    <Option label={item.name} title={item.name} value={item.pk} disabled={item.disabled}>
                      {item.name}
                    </Option>
                  )
                })}
              </OptGroup>
            )
          })}
        </Select>
      </div>
      <Table {...tableProps} dataSource={handleFilter(roadmaps)} columns={columns} />
    </div>
  )
}
export default TaskTemplateExpandedRow
