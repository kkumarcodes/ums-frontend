// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createCtx } from 'components/administrator'
import moment, { Moment } from 'moment'
import { useState } from 'react'

export enum CounselorTimeEntryPaymentStatus {
  Paid,
  Unpaid,
  PaidAndUnpaid,
}

/** Context for filtering counselor time entries */
export function useCreateCounselorTimeEntryContext() {
  const [student, setStudent] = useState<number>()
  const [paygo, setPaygo] = useState(false)
  const [counselor, setCounselor] = useState<number>()
  const [start, setStart] = useState<Moment | undefined>(moment().subtract(1, 'month').startOf('month'))
  const [end, setEnd] = useState<Moment | undefined>(moment().add(1, 'd'))
  const [paymentStatus, setPaymentStatus] = useState(CounselorTimeEntryPaymentStatus.PaidAndUnpaid)

  return {
    student,
    setStudent,
    counselor,
    setCounselor,
    start,
    setStart,
    end,
    setEnd,
    paygo,
    setPaygo,
    paymentStatus,
    setPaymentStatus,
  }
}

export const [useCounselorTimeEntryCtx, CounselorTimeEntryContextProvider] = createCtx<
  ReturnType<typeof useCreateCounselorTimeEntryContext>
>()
