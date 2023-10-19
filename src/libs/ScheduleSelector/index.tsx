// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Selection } from 'components/common/Availability/AvailabilityScheduler'
import { addDays, addHours, format as formatDate, isSameMinute, startOfDay } from 'date-fns'
import { sortBy, uniqBy, cloneDeep } from 'lodash'
import moment from 'moment'
import React, { ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import colors from './colors'
import selectionSchemes from './selection-schemes'
import { Subtitle, Text } from './typography'

export enum SelectionType {
  Add = 'add',
  Remove = 'remove',
}

// We only make use of the linear scheme
export enum SelectionSchemeType {
  Linear = 'linear',
  Square = 'square',
}

const formatHour = (hour: number): string => {
  const h = hour === 0 || hour === 12 || hour === 24 ? 12 : hour % 12
  const abb = hour < 12 || hour === 24 ? ' am' : ' pm'
  return `${h}${abb}`
}

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  position: relative;
  align-items: center;
  width: 100%;
  padding: 0 40px;
  user-select: none;
`

const Grid = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  height: 600px;
`

const ColumnLeft = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1 1 0;
`

const ColumnRight = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 3 1 0;
`

type GridCellProps = {
  margin: number
}

export const GridCell = styled.div`
  margin: ${(props: GridCellProps) => props.margin}px;
  touch-action: none;
  flex: 1 1 0;
`

type DateCellProps = {
  selected: boolean
  selectedColor: string
  hoveredColor: string
  unselectedColor: string
}

const DateCellInternal = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${(props: DateCellProps) => (props.selected ? props.selectedColor : props.unselectedColor)};

  &:hover {
    background-color: ${(props: DateCellProps) => props.hoveredColor};
    cursor: pointer;
  }
`

const DateLabel = styled(Subtitle)`
  flex: 1 1 0;
  height: 100%;
  margin-bottom: 0px;
  display: flex;
  justify-content: flex-start;
  padding: 0 20px;
  align-items: center;
  border-bottom: 1px solid darkgrey;
  @media (max-width: 699px) {
    font-size: 12px;
  }
`

const TimeText = styled(Text)`
  margin: 0;
  position: relative;
  font-weight: 700;
  font-size: 14px;
  @media (max-width: 699px) {
    font-size: 12px;
  }
`

type RefSetter = HTMLDivElement | null

type Props = {
  defaultLocation: number | null
  selection: Selection
  onChange: (newSelection: Selection) => void
  minTime?: number
  maxTime?: number
  numDays?: number
  selectionScheme?: SelectionSchemeType
  startDate?: Date
  dateFormat?: string
  unselectedColor?: string
  selectedColor?: string
  hoveredColor?: string
  renderDateCell?: (date: Date, selected: boolean, selection: Selection, refSetter: RefSetter) => ReactNode
}

type Dates = Date[][]

type SelectionSchemeHandlers = {
  [index: string]: (startDate: Date, endDate: Date, dates: Dates, defaultLocation: number | null) => Selection
}

export const preventScroll = (e: TouchEvent) => {
  e.preventDefault()
}

type CellToDate = Map<HTMLElement, Date>

// In the case that a user is drag-selecting, we don't want to call props.onChange()
// until they have completed the drag-select.
// selectionDraft serves as a temporary copy during drag-selects.
export const ScheduleSelector = ({
  defaultLocation,
  selection,
  onChange,
  minTime = 9,
  maxTime = 23,
  numDays = 7,
  startDate = new Date(),
  selectionScheme = SelectionSchemeType.Linear,
  dateFormat = 'E M-d',
  unselectedColor = colors.paleBlue,
  selectedColor = colors.blue,
  hoveredColor = colors.lightBlue,
  renderDateCell,
}: Props) => {
  const startTime = startOfDay(startDate)
  const dates: Dates = []
  const cellToDate: CellToDate = new Map()

  for (let d = 0; d < numDays; d += 1) {
    const currentDay = []
    for (let h = minTime; h <= maxTime; h += 1) {
      currentDay.push(addHours(addDays(startTime, d), h))
    }
    dates.push(currentDay)
  }

  const gridRef = useRef<HTMLDivElement | null>(null)

  const [selectionDraft, setSelectionDraft] = useState(selection)
  const [selectionType, setSelectionType] = useState<SelectionType | null>(null)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [isTouchDragging, setIsTouchDragging] = useState(false)

  const selectionSchemeHandlers: SelectionSchemeHandlers = {
    linear: selectionSchemes.linear,
  }

  const endSelection = () => {
    setSelectionType(null)
    setSelectionStart(null)
  }

  useEffect(() => {
    // We need to add the endSelection event listener to the document itself in order
    // to catch the cases where the users ends their mouse-click somewhere besides
    // the date cells (in which case none of the DateCell's onMouseUp handlers would fire)
    //
    // This isn't necessary for touch events since the `touchend` event fires on
    // the element where the touch/drag started so it's always caught.
    document.addEventListener('mouseup', endSelection)

    // Prevent page scrolling when user is dragging on the date cells
    cellToDate.forEach((value, dateCell) => {
      if (dateCell && dateCell.addEventListener) {
        dateCell.addEventListener('touchmove', preventScroll, { passive: false })
      }
    })

    return () => {
      document.removeEventListener('mouseup', endSelection)
      cellToDate.forEach((value, dateCell) => {
        if (dateCell && dateCell.removeEventListener) {
          dateCell.removeEventListener('touchmove', preventScroll)
        }
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // This passes the new selectionDraft back up to the `AvailabilityScheduler`
  // so that it may render into time-blocks
  useEffect(() => {
    onChange(selectionDraft)
  }, [JSON.stringify(selectionDraft)]) // eslint-disable-line react-hooks/exhaustive-deps

  // Performs a lookup into `cellToDate` to retrieve the Date that corresponds to
  // the cell where this touch event is right now. Note that this method will only work
  // if the event is a `touchmove` event since it's the only one that has a `touches` list.
  const getTimeFromTouchEvent = (e: TouchEvent): Date | null => {
    const { touches } = e
    if (!touches || touches.length === 0) return null
    const { clientX, clientY } = touches[0]
    const targetElement = document.elementFromPoint(clientX, clientY) as HTMLElement
    const cellTime = cellToDate.get(targetElement) as Date
    return cellTime
  }

  // Given an ending Date, determines all the dates that should be selected in this draft
  const updateAvailabilityDraft = (selectionEnd: Date | null) => {
    if (selectionType === null || selectionStart === null) return

    // newSelection is the newly selected time-block
    let newSelection: Selection = []
    if (selectionStart && selectionEnd && selectionType) {
      newSelection = cloneDeep(
        selectionSchemeHandlers[selectionScheme](selectionStart, selectionEnd, dates, defaultLocation),
      )
    }
    // currentSelection is the existing selected time-blocks (prior to the newSelection)
    const currentSelection = cloneDeep(selection) as Selection

    // Below we combine the currentSelection with the newSelection to create the nextSelectionDraft
    if (selectionType === 'add') {
      const lastAddedNewSelectionIndex = newSelection.length - 1

      // Determine if the first added cell was an existing selected cell
      const currentSelectionFirstAddedCellIndex = currentSelection.findIndex(selectionItem =>
        isSameMinute(selectionItem.date, newSelection[0].date),
      )

      // Determine if the last added cell was an existing selected cell
      const currentSelectionLastAddedCellIndex = currentSelection.findIndex(selectionItem =>
        isSameMinute(selectionItem.date, newSelection[lastAddedNewSelectionIndex].date),
      )

      /**
       * Below are several cases where because of the newly selected time-block (newSelection)
       * existing time-blocks (currentSelection) need to have their isFirst or isLast fields mutated
       * in order to faithfully represent intact ("whole") time-blocks in the UI
       */

      // CASE 1: First added newSelection hour-block was a pre-existing hour-block
      //         Check if previous hour-block also exist, if so it should become a new bottom-block
      if (currentSelectionFirstAddedCellIndex >= 0) {
        // if (currentSelectionLastAddedCell.isFirst && currentSelection[currentSelectionLastAddedCellIndex + 1]) {
        if (currentSelection[currentSelectionFirstAddedCellIndex - 1]) {
          currentSelection[currentSelectionFirstAddedCellIndex - 1].isLast = true
        }
      }

      // CASE 2: Last added newSelection hour-block was a pre-existing hour-block
      //         Check if following hour-block also exist, if so it should become a new top-block
      if (currentSelectionLastAddedCellIndex >= 0) {
        // if (currentSelectionLastAddedCell.isFirst && currentSelection[currentSelectionLastAddedCellIndex + 1]) {
        if (currentSelection[currentSelectionLastAddedCellIndex + 1]) {
          currentSelection[currentSelectionLastAddedCellIndex + 1].isFirst = true
        }
      }

      const nextSelectionDraft = uniqBy([...newSelection, ...currentSelection], x => x.date.toISOString())
      setSelectionDraft(sortBy(nextSelectionDraft, selection => selection.date.toISOString()))
    } else if (selectionType === 'remove') {
      const currentSelectionFirstRemovedCellIndex = currentSelection.findIndex(selection =>
        isSameMinute(selection.date, newSelection[0].date),
      )
      if (currentSelectionFirstRemovedCellIndex >= 0) {
        // CASE 3: The first cell removed has an existing hour-block above it,
        //         the above block (if it exists) should become a new bottom-block
        if (currentSelection[currentSelectionFirstRemovedCellIndex - 1]) {
          currentSelection[currentSelectionFirstRemovedCellIndex - 1].isLast = true
        }
        // TODO: I have a hunch this is unnecessary and is actually handled by case 5 ... 🤷‍♂️
        // CASE 4: The first cell removed has an existing time-block below it,
        //         the below block should become a new top-block (if it exists)
        if (currentSelection[currentSelectionFirstRemovedCellIndex + 1]) {
          currentSelection[currentSelectionFirstRemovedCellIndex + 1].isFirst = true
        }
      }
      const currentSelectionLastRemovedCellIndex = currentSelection.findIndex(selection =>
        isSameMinute(selection.date, newSelection[newSelection.length - 1].date),
      )
      if (currentSelectionLastRemovedCellIndex >= 0) {
        // CASE 5: The last cell removed has a pre-existing time-block below it,
        //         the following cell (the one after the removed cell) should become a new-top block (if it exists)
        if (currentSelection[currentSelectionLastRemovedCellIndex + 1]) {
          currentSelection[currentSelectionLastRemovedCellIndex + 1].isFirst = true
        }
      }
      // This handles filtering all the removed blocks that were 'in-between' the top and bottom removed blocks
      // from the pre-existing time-blocks to create the nextSelectionDraft
      const nextSelectionDraft = currentSelection.filter(a => !newSelection.find(b => isSameMinute(a.date, b.date)))
      setSelectionDraft(sortBy(nextSelectionDraft, selection => selection.date.toISOString()))
    }
  }

  // Isomorphic (mouse and touch) handler since starting a selection works the same way for both classes of user input
  const handleSelectionStartEvent = (newStartTime: Date) => {
    // Check if the startTime cell is selected/unselected to determine if this drag-select should
    // add values or remove values
    const timeSelected = selection.find(a => isSameMinute(a.date, newStartTime))
    setSelectionType(timeSelected ? SelectionType.Remove : SelectionType.Add)
    setSelectionStart(newStartTime)
  }

  const handleMouseEnterEvent = (time: Date) => {
    // Need to update selection draft on mouseup as well in order to catch the cases
    // where the user just clicks on a single cell (because no mouseenter events fire
    // in this scenario)
    updateAvailabilityDraft(time)
  }

  const handleMouseUpEvent = (time: Date) => {
    updateAvailabilityDraft(time)
    // Don't call this.endSelection() here because the document mouseup handler will do it
  }

  const handleTouchMoveEvent = (event: TouchEvent) => {
    setIsTouchDragging(true)
    const cellTime = getTimeFromTouchEvent(event)
    if (cellTime) {
      updateAvailabilityDraft(cellTime)
    }
  }

  const handleTouchEndEvent = () => {
    if (isTouchDragging) {
      // Going down this branch means the user tapped but didn't drag -- which
      // means the availability draft hasn't yet been updated (since
      // handleTouchMoveEvent was never called) so we need to do it now
      updateAvailabilityDraft(null)
      endSelection()
    } else {
      endSelection()
    }
    setIsTouchDragging(false)
  }

  const renderTimeLabels = () => {
    const labels = [
      <DateLabel key={-1}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div>&nbsp;</div>
          <div>&nbsp;</div>
        </div>
      </DateLabel>,
    ] // Ensures time labels start at correct location
    for (let t = minTime; t <= maxTime; t += 1) {
      labels.push(
        <DateLabel key={t}>
          <TimeText>{formatHour(t)}</TimeText>
        </DateLabel>,
      )
    }
    return <ColumnLeft>{labels}</ColumnLeft>
  }

  const renderDateCellHandler = (time: Date, selected: boolean): ReactNode => {
    const refSetter = (dateCell: HTMLDivElement) => {
      cellToDate.set(dateCell, time)
    }
    if (renderDateCell) {
      return renderDateCell(time, selected, selection, refSetter)
    }
    return (
      <DateCellInternal
        selected={selected}
        ref={refSetter}
        selectedColor={selectedColor}
        unselectedColor={unselectedColor}
        hoveredColor={hoveredColor}
      />
    )
  }

  const renderDateCellWrapper = (time: Date): ReactElement => {
    // This handler is responsible for initiating the addition and removal of time-blocks
    const startHandler = (e: any) => {
      // We bail early if what was clicked was the `remote` or `in-person` icon
      e.persist()
      if (e.nativeElement?.innerHTML.includes('path') || e.target.className.includes('ant-btn' || 'anticon')) {
        return
      }
      handleSelectionStartEvent(time)
    }

    const selected = Boolean(selection.find(a => isSameMinute(a.date, time)))

    return (
      <GridCell
        role="presentation"
        key={time.toISOString()}
        // Mouse handlers
        onMouseDown={startHandler}
        onMouseEnter={() => {
          handleMouseEnterEvent(time)
        }}
        onMouseUp={() => {
          handleMouseUpEvent(time)
        }}
        // Touch handlers
        // Since touch events fire on the event where the touch-drag started, there's no point in passing
        // in the time parameter, instead these handlers will do their job using the default SyntheticEvent
        // parameters
        onTouchStart={startHandler}
        onTouchMove={handleTouchMoveEvent}
        onTouchEnd={handleTouchEndEvent}
      >
        {renderDateCellHandler(time, selected)}
      </GridCell>
    )
  }

  const renderDateColumn = (dayOfTimes: Array<Date>) => {
    return (
      <ColumnRight key={moment(dayOfTimes[0]).valueOf()}>
        <DateLabel>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              alignItems: 'stretch',
            }}
          >
            {formatDate(dayOfTimes[0], dateFormat)
              .split(' ')
              .map((ele, idx) => {
                if (formatDate(dayOfTimes[0], dateFormat).split(' ').length === 1) {
                  return (
                    <div key={`${ele}-${idx}`}>
                      <div style={{ textAlign: 'center', position: 'relative', top: 12 }}>{`${ele}s`}</div>
                      <div>&nbsp;</div>
                    </div>
                  )
                }
                return (
                  <div key={`${ele}-${idx}`} style={{ textAlign: 'center' }}>
                    {ele}
                  </div>
                )
              })}
          </div>
        </DateLabel>
        {dayOfTimes.map(renderDateCellWrapper)}
      </ColumnRight>
    )
  }
  return (
    <Wrapper>
      <Grid ref={gridRef} style={{ borderTop: '1px solid darkgrey' }}>
        {renderTimeLabels()}
        {dates.map(renderDateColumn)}
      </Grid>
    </Wrapper>
  )
}
