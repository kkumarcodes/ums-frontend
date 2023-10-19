// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { EditOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Checkbox, DatePicker, Input, message, Row, Table, Tooltip } from 'antd'
import { TableProps } from 'antd/lib/table'
import moment, { Moment } from 'moment'
import { renderHighlighter } from 'components/administrator'
import { flatten, orderBy, uniq, without } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTasks } from 'store/task/tasksSelectors'
import { fetchTasks, sendTaskReminder } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import { getStudents } from 'store/user/usersSelector'
import { getFullName, sortBoolean, sortNullishDateStrings, sortString } from '../administrator/utils'
import styles from './styles/CounselorAllTasksPage.scss'

type Props = {
  counselorID: number
}

const CounselorAllTasksPage = ({ counselorID }: Props) => {
  const dispatch = useReduxDispatch()
  const studentDict = useSelector(getStudents)
  const [startDate, setStartDate] = useState(moment().subtract(28, 'days'))
  const [endDate, setEndDate] = useState(moment())
  const tasks: Task[] = useSelector(selectTasks).filter(t =>
    moment(t.due).isBetween(startDate.startOf('day'), endDate.endOf('day')),
  )
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [essayOnly, setEssayOnly] = useState(false)
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  // PKs of tasks we are in the process of sending reminders for
  const [sendingReminders, setSendingReminders] = useState<number[]>([])

  //grabbing tasks
  useEffect(() => {
    setLoading(true)
    dispatch(
      fetchTasks({ counselor: counselorID, start: startDate.format('YYYY-MM-DD'), end: endDate.format('YYYY-MM-DD') }),
    ).finally(() => setLoading(false))
  }, [dispatch, startDate, endDate, counselorID])

  const tableProps: TableProps<Task> = {
    rowKey: 'slug',
    showHeader: true,
    className: 'allTaskTable',
    loading,
    expandRowByClick: true,
  }

  // Event handler to send reminder for task to user
  const doSendReminder = (taskPK: number) => {
    setSendingReminders([...sendingReminders, taskPK])
    dispatch(sendTaskReminder(taskPK))
      .catch(() => message.warning('Unable to send reminder'))
      .finally(() => setSendingReminders(without(sendingReminders, taskPK)))
  }

  const renderTitle = (text: string, record: Task) => {
    const name = record?.title
    return <span>{renderHighlighter(name, search)}</span>
  }

  const renderFullName = (text: string, record: Task) => {
    const name = getFullName(studentDict[record.for_student])
    return <span>{renderHighlighter(name, search)}</span>
  }

  const renderDueDate = (text: string, record: Task) => {
    const formattedDate = moment(record.due).format('MM/DD/YYYY')
    return <span>{formattedDate}</span>
  }

  const renderGradYear = (text: string, record: Task) => {
    const gradYear = studentDict[record.for_student].graduation_year
    return <span>{gradYear}</span>
  }

  //creating a filter list that is ordered and only has unique values
  const gradYearFilters = () => {
    const studentGradYears = uniq(tasks.map(task => studentDict[task.for_student].graduation_year)).sort(
      (a, b) => a - b,
    )
    const filters = studentGradYears.map(gradYear => ({
      text: gradYear,
      value: gradYear,
    }))
    return filters
  }

  // Renders datetime of last reminder sent, and also includes but to send remidner
  const renderReminder = (_, task: Task) => {
    return (
      <div className="last-reminder">
        {task.last_reminder_sent && <span className="help">{moment(task.last_reminder_sent).format('MMM Do')}</span>}
        <Tooltip title="Send Reminder Now">
          <Button
            onClick={() => doSendReminder(task.pk)}
            loading={sendingReminders.includes(task.pk)}
            icon={<SendOutlined />}
            size="small"
            type="link"
          />
        </Tooltip>
      </div>
    )
  }

  const renderActions = (text: string, record: Task) => {
    const studentID = record.for_student
    const taskID = record.pk
    return (
      <Row>
        <Button
          className="view-task-modal-button"
          size="small"
          onClick={() => {
            dispatch(showModal({ modal: MODALS.CREATE_COUNSELING_TASK, props: { taskID, studentID } }))
          }}
        >
          <EditOutlined />
        </Button>
      </Row>
    )
  }
  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'for_student',
      render: renderFullName,
      sorter: (a: Task, b: Task) =>
        sortString(studentDict[a.for_student].last_name, studentDict[b.for_student].last_name),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Task Title',
      dataIndex: 'title',
      render: renderTitle,
      sorter: (a: Task, b: Task) => sortString(a.title, b.title),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Due Date',
      dataIndex: 'due',
      render: renderDueDate,
      sorter: (a: Task, b: Task) => sortString(a.due ?? '', b.due ?? ''),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Completed',
      dataIndex: 'completed',
      render: (value: string) => <div className="completed-string">{value ? 'Yes' : 'No'}</div>,
      sorter: (a: Task, b: Task) => sortBoolean(!!a.completed, !!b.completed),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Grad Year',
      dataIndex: 'for_student',
      filters: gradYearFilters(),
      onFilter: (value, record) => studentDict[record.for_student].graduation_year === value,
      render: renderGradYear,
      sorter: (a: Task, b: Task) =>
        studentDict[a.for_student].graduation_year - studentDict[b.for_student].graduation_year,
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Remind',
      dataIndex: 'last_reminder_sent',
      sorter: (a: Task, b: Task) => sortNullishDateStrings(a.last_reminder_sent, b.last_reminder_sent),
      render: renderReminder,
    },
    {
      title: '',
      dataIndex: 'actions',
      render: renderActions,
    },
  ]

  const updateDateRange = (dates: [Moment | null, Moment | null] | null, dateStrings: [string, string]) => {
    if (setStartDate) setStartDate(dates?.[0] || undefined)
    if (setEndDate) setEndDate(dates?.[1] || undefined)
  }

  //searches Tasks titles and Student names, includes the essay only filtering as well.
  const handleFilter = (tasks: Task[]) => {
    const trimmedText = search.trim().toLowerCase()
    const filterFunc = (task: Task) => {
      if (
        trimmedText &&
        !(
          task.title.toLowerCase().includes(trimmedText) ||
          (task.for_student && getFullName(studentDict[task.for_student]).toLowerCase().includes(trimmedText))
        )
      ) {
        return false
      }
      if (essayOnly && !task.is_prompt_task) return false
      if (incompleteOnly && task.completed) return false
      return true
    }
    return tasks.filter(filterFunc)
  }

  return (
    <section className={styles.allTasksPage}>
      <h2>All Tasks</h2>
      <div className="search-and-date-range">
        <Input
          className="search-input"
          placeholder="Search: "
          value={search}
          onChange={e => setSearch(e.target.value)}
          maxLength={50}
        />
        <div className="date-picker-group">
          <label className="filter-date-label">Filter Date:</label>
          <DatePicker.RangePicker
            className="range-picker"
            allowEmpty={[false, false]}
            defaultValue={[startDate, endDate]}
            onChange={updateDateRange}
            format="MM/DD/YYYY"
          />
        </div>
      </div>
      <div className="checkbox-filters">
        <div className="essay-checkbox">
          <label>Essay Tasks Only: &nbsp;</label>
          <Checkbox onChange={() => setEssayOnly(!essayOnly)} />
        </div>
        <div className="completed-checkbox">
          <label>Incomplete Tasks Only: &nbsp;</label>
          <Checkbox onChange={() => setIncompleteOnly(!incompleteOnly)} />
        </div>
      </div>
      <Table
        {...tableProps}
        dataSource={handleFilter(tasks)}
        columns={columns}
        size="small"
        pagination={{ pageSize: 50 }}
      />
    </section>
  )
}

export default CounselorAllTasksPage
