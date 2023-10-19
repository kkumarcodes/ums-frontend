// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { LocationModalProps } from 'store/display/displayTypes'
import { selectActiveModal, selectVisibleLocationModal } from 'store/display/displaySelectors'
import { useReduxDispatch } from 'store/store'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import Modal from 'antd/lib/modal/Modal'
import { closeModal } from 'store/display/displaySlice'
import { LocationForm } from 'components/administrator/locations/LocationForm'

/**  Component renders Location modal.  Allows editing of location) */
const LocationModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleLocationModal)
  const props = useSelector(selectActiveModal)?.modalProps as LocationModalProps
  const pk = props?.pk

  const location = useSelector((state: RootState) => (pk ? state.tutoring.locations[pk] : null))

  const renderTitle = () => {
    return <h3 className="headerModal">{`${pk ? 'Edit' : 'Create'} Location`}</h3>
  }

  const handleClose = (): void => {
    dispatch(closeModal())
  }

  return (
    <Modal
      wrapClassName="containerModal"
      title={renderTitle()}
      style={{ top: 40 }}
      visible={visible}
      onCancel={handleClose}
      footer={null}
      destroyOnClose={true}
    >
      <LocationForm location={location} handleClose={handleClose} />
    </Modal>
  )
}

export default LocationModal
