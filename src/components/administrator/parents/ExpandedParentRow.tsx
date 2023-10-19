// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import InvitationStatus from 'components/administrator/users/InvitationStatus'
import React from 'react'
import { UserType } from 'store/user/usersTypes'

type Props = {
  parentID: number
}

export const ExpandedParentRow = ({ parentID }: Props) => {
  return (
    <div>
      <InvitationStatus userID={parentID} userType={UserType.Parent} />
    </div>
  )
}
