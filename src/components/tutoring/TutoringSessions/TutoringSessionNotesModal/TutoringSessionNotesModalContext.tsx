// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  studentTutoringSessionSelectorFactory,
  groupTutoringSessionSelectorFactory,
} from 'store/tutoring/tutoringSelectors'
import { FileUpload } from 'store/common/commonTypes'
import { createCtx } from 'components/administrator'
import { clone } from 'lodash'
import { TutoringSessionType } from 'store/tutoring/tutoringTypes'

export type ShareTutoringSessionNotes = {
  parent: boolean
  student: boolean
}
type TutoringSessionDetails = {
  sessionType: TutoringSessionType
  subject: number // TutoringService
  note: string
}
const DEFAULT_SHARE = { parent: true, student: true }

export function useCreateTutoringSessionNotesCtx() {
  const [individualSessionPK, setIndividualSessionPK] = useState<number>() // Session being edited
  const [groupSessionPK, setGroupSessionPK] = useState<number>()
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])
  const [share, setShare] = useState(clone(DEFAULT_SHARE))
  const [ccEmail, setCCEMail] = useState('')

  const individualSession = useSelector(studentTutoringSessionSelectorFactory(individualSessionPK))
  const groupSession = useSelector(groupTutoringSessionSelectorFactory(groupSessionPK))
  const [sessionDetails, setSessionDetails] = useState<TutoringSessionDetails>()

  useEffect(() => {
    if (individualSession) {
      setSessionDetails({
        note: individualSession.note,
        sessionType: individualSession.session_type,
        subject: individualSession.tutoring_service,
      })
    }
  }, [individualSession])

  const reset = () => {
    setIndividualSessionPK(undefined)
    setGroupSessionPK(undefined)
    setFileUploads([])
    // setSessionDetails(undefined)
    setShare(clone(DEFAULT_SHARE))
  }
  return {
    reset,
    setIndividualSessionPK,
    setGroupSessionPK,
    fileUploads,
    setFileUploads,
    individualSession,
    groupSession,
    share,
    setShare,
    ccEmail,
    setCCEMail,
    sessionDetails,
    setSessionDetails,
  }
}

export const [useTutoringSessionNotesCtx, TutoringSessionNotesCtxProvider] = createCtx<
  ReturnType<typeof useCreateTutoringSessionNotesCtx>
>()
