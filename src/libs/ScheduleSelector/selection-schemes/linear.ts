import { Selection } from 'components/common/Availability/AvailabilityScheduler'
import { isBefore } from 'date-fns'
import * as dateUtils from '../date-utils'

const linear = (
  selectionStart: Date,
  selectionEnd: Date,
  dateList: Array<Array<Date>>,
  defaultLocation: number | null,
): Selection => {
  let selected: Date[] = []
  if (selectionEnd == null) {
    if (selectionStart) selected = [selectionStart]
  } else if (selectionStart) {
    const reverseSelection = isBefore(selectionEnd, selectionStart)
    selected = dateList.reduce(
      (acc, dayOfTimes) =>
        acc.concat(
          dayOfTimes.filter(
            t =>
              selectionStart &&
              selectionEnd &&
              dateUtils.dateHourIsBetween(
                reverseSelection ? selectionEnd : selectionStart,
                t,
                reverseSelection ? selectionStart : selectionEnd,
              ),
          ),
        ),
      [],
    )
  }
  // Makes newly selected time-blocks aware of their position and location
  // Note: newly selected time-blocks are set to the defaultLocation for the given day
  const selectedDatesWithLocationAndPosition = selected.map((date, index, selectedArray) => {
    const isFirst = index === 0
    const isLast = index === selectedArray.length - 1

    return {
      date,
      location: defaultLocation,
      isFirst,
      isLast,
    }
  })
  return selectedDatesWithLocationAndPosition
}

export default linear
