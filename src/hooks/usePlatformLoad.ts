/** This method should be called when a platform loads to redirect or display a modal
 * depending on query params
 */

import { message } from 'antd'
import { useSelector } from 'react-redux'
import { fetchCounselorMeeting } from 'store/counseling/counselingThunks'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsStudentOrParent } from 'store/user/usersSelector'

const WARNING_DURATION = 12 // Seconds

const usePlatformLoad = () => {
  const dispatch = useReduxDispatch()
  // const params = new URLSearchParams(useLocation().search)
  const params = new URLSearchParams(window.location.search)
  const isStudentOrParent = useSelector(selectIsStudentOrParent)
  // urlParams.forEach((v, k) => params.append(k, v))
  // All the different things that may happen on load
  // DO NOT call this ethod until initial data for platform has been loaded
  const onLoad = async () => {
    if (params.get('scheduleCounselorMeeting')) {
      if (!isStudentOrParent) {
        message.warn(
          'Links to schedule meetings  will not work on your counselor account (they only work for parents and students). Click the edit button (pencil icon) to schedule or reschedule a meeting.',
          WARNING_DURATION,
        )
      } else {
        const meeting = await dispatch(fetchCounselorMeeting(Number(params.get('scheduleCounselorMeeting'))))
        dispatch(showModal({ modal: MODALS.SCHEDULE_COUNSELOR_MEETING, props: { meetingID: meeting.pk } }))
      }
    }
  }
  return onLoad
}
export default usePlatformLoad
