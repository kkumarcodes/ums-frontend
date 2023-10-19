// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSelector } from '@reduxjs/toolkit'
import { ModalInstance, MODALS, ModalVisibility } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'

export const getActiveModalIndex = (state: RootState) => state.display.activeModalIndex
export const getModals = (state: RootState) => state.display.modals
export const getDisplay = (state: RootState) => state.display

const selectActiveModalType = createSelector([getActiveModalIndex, getModals], (activeIndex, modals) =>
  activeIndex > -1 ? modals[activeIndex].modalType : undefined,
)
export const selectActiveModal = createSelector([getActiveModalIndex, getModals], (activeIndex, modals) =>
  activeIndex > -1 ? modals[activeIndex] : undefined,
)
// Returns active modal props if active modal is of type modal, otherwise undefined
export const selectActiveModalProps = createSelector([getActiveModalIndex, getModals], (activeIndex, modals) =>
  activeIndex > -1 ? modals[activeIndex].modalProps : undefined,
)

//Helper function to determine if modal of specified modal type(s) is currently visible

const modalVisible = (modalType: MODALS | MODALS[], activeModal?: ModalInstance) => {
  const modalTypes = Array.isArray(modalType) ? modalType : [modalType]
  return Boolean(
    activeModal?.modalType !== undefined &&
      modalTypes.includes(activeModal?.modalType) &&
      activeModal?.visibility === ModalVisibility.Visible,
  )
}
/** Helper function that creates a selector to determine if @param modalType is active or not */
const createVisibleSelector = (modalType: MODALS | MODALS[]) => {
  return createSelector(
    [getActiveModalIndex, selectActiveModal],
    (activeIndex, activeModal) => activeIndex > -1 && modalVisible(modalType, activeModal),
  )
}
const createVisiblePropsSelector = (modalType: MODALS | MODALS[]) => {
  return createSelector([getActiveModalIndex, selectActiveModal], (activeIndex, activeModal) => {
    if (activeIndex > -1 && activeModal && modalVisible(modalType, activeModal)) {
      return activeModal.modalProps
    }
    return undefined
  })
}

// TODO: Refactor to MODALS.NOUN pattern (i.e. remove CREATE/EDIT)
export const selectVisibleCreateTutoringSessionModal = createSelector(
  [getActiveModalIndex, selectActiveModalType],
  (activeIndex, modalType) => {
    return (
      activeIndex > -1 && (modalType === MODALS.EDIT_TUTORING_SESSION || modalType === MODALS.CREATE_TUTORING_SESSION)
    )
  },
)
export const selectVisibleTutoringSessionNoteModal = createSelector(
  [getActiveModalIndex, selectActiveModalType],
  (activeIndex, modalType) =>
    activeIndex > -1 &&
    (modalType === MODALS.EDIT_TUTORING_SESSION_NOTE || modalType === MODALS.CREATE_TUTORING_SESSION_NOTE),
)

export const selectVisiblePurchaseTutoringPackageModal = createVisibleSelector(MODALS.PURCHASE_TUTORING_PACKAGE)
export const selectVisibleGroupTutoringSessionModal = createVisibleSelector(MODALS.GROUP_TUTORING_SESSION)
export const selectVisibleGoogleCalInstructionsModal = createVisibleSelector(MODALS.GOOGLE_CAL_INSTRUCTIONS)
export const selectVisibleTimeCardModal = createVisibleSelector(MODALS.TIME_CARD)
export const selectVisibleLocationModal = createVisibleSelector(MODALS.LOCATION)
export const selectVisibleTestResultModal = createVisibleSelector(MODALS.TEST_RESULT)
export const selectVisibleHamburgerMenuModal = createVisibleSelector(MODALS.HAMBURGER_MENU)
export const selectVisibleCourseModal = createVisibleSelector(MODALS.COURSE)
export const selectVisiblePaygoPurchaseModal = createVisibleSelector(MODALS.PAYGO_PURCHASE)
export const selectVisibleLateCancelModal = createVisibleSelector(MODALS.LATE_CANCEL_CONFIRMATION)
export const selectVisibleDiagnosticRegistrationDetailsModal = createVisibleSelector(
  MODALS.DIAGNOSTIC_REGISTRATION_DETAILS,
)

/** USE THESE SELECTORS IN COMPONENTS TO GET PROPS AND VISIBLE */
export const selectVisibleModal = (modalType: MODALS | MODALS[]) => createVisibleSelector(modalType)
export const selectVisibleModalProps = (modalType: MODALS | MODALS[]) => createVisiblePropsSelector(modalType)
export const selectAllModals = createSelector(getModals, m => m)
