// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ArrowRightOutlined, CheckCircleFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, message, Select, Skeleton } from 'antd'
import { getFullName } from 'components/administrator'
import { filter, map, sortBy } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { closeModal } from 'store/display/displaySlice'
import { useReduxDispatch } from 'store/store'
import { createTutoringPackagePurchase, fetchPurchaseableTutoringPackages } from 'store/tutoring/tutoringThunks'
import { TutoringPackage } from 'store/tutoring/tutoringTypes'
import { selectStudent, selectTutorsForStudent } from 'store/user/usersSelector'
import styles from './styles/PurchaseTutoringPackageModal.scss'

type Props = {
  studentID: number
  onPurchase?: () => void
}

const PurchaseIndividualTutoringPackage = ({ studentID, onPurchase }: Props) => {
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [packageOptions, setPackageOptions] = useState<TutoringPackage[]>([])
  const [selectedTutor, setSelectedTutor] = useState<number | null>(null)
  const [currPaygoHours, setCurrPaygoHours] = useState(1)
  const [testPrepPaygoHours, setTestPrepPaygoHours] = useState(1)
  const [selectedPackage, setSelectedPackage] = useState<number>()
  const dispatch = useReduxDispatch()

  const studentTutors = useSelector(selectTutorsForStudent(studentID))
  const student = useSelector(selectStudent(studentID))
  const hasTransactionID = !!student?.last_paygo_purchase_id

  // Variables that aid in render
  const restrictedTutors = map(packageOptions, 'restricted_tutor').filter(t => t)
  const tutorsWithPricing = filter(studentTutors, tutor => restrictedTutors.includes(tutor.pk))
  // We require selecting tutor if student has more than one tutor and at least one has their own package pricing
  const requireSelectTutor = studentTutors.length > 1 && tutorsWithPricing.length > 0
  const filteredPackageOptions = requireSelectTutor
    ? packageOptions.filter(p => p.restricted_tutor === selectedTutor)
    : packageOptions

  const paygoCurriculumPackage = filteredPackageOptions.find(
    p => p.is_paygo_package && p.individual_curriculum_hours === 1,
  )
  const paygoTestPrepPackage = filteredPackageOptions.find(
    p => p.is_paygo_package && p.individual_test_prep_hours === 1,
  )
  const testPrepPackages = filteredPackageOptions.filter(
    p => p.individual_test_prep_hours > 1 && p.restricted_tutor === selectedTutor,
  )
  const currPackages = filteredPackageOptions.filter(
    p => p.individual_curriculum_hours > 1 && p.restricted_tutor === selectedTutor,
  )

  // Little hack to ensure if the student has just one tutor and they have their own pricing, that tutor
  // gets selected even though we don't render the dropdown. Also resets selected tutor
  const setTutorPK = tutorsWithPricing.length && !requireSelectTutor ? tutorsWithPricing[0].pk : null
  useEffect(() => {
    setSelectedTutor(setTutorPK)
  }, [setTutorPK])

  // We always load packages on mount
  useEffect(() => {
    setLoading(true)
    dispatch(fetchPurchaseableTutoringPackages(studentID))
      .then((packages: TutoringPackage[]) => {
        const activePackages = map(filter(packages, 'active'), p => ({
          ...p,
          individual_curriculum_hours: Number(p.individual_curriculum_hours),
          individual_test_prep_hours: Number(p.individual_test_prep_hours),
          group_test_prep_hours: Number(p.group_test_prep_hours),
        }))
        setPackageOptions(sortBy(activePackages, p => p.individual_test_prep_hours + p.individual_curriculum_hours))
        setLoading(false)
      })
      .catch(e => message.warning('Failed to load tutoring packages. Please try again.'))
  }, [dispatch, studentID])

  // Helper to render a package option that's NOT A PAYGO PACKAGE
  const renderPackageOption = (tutoringPackage: TutoringPackage) => {
    return (
      <div className="package-option flex">
        <div className="hours">
          {tutoringPackage.individual_test_prep_hours > 0
            ? tutoringPackage.individual_test_prep_hours
            : tutoringPackage.individual_curriculum_hours}
          &nbsp;Hour Package
        </div>
        <div className="price">${tutoringPackage.price}</div>
        <div className="purchase">
          <Button type="primary" onClick={_ => setSelectedPackage(tutoringPackage.pk)}>
            Purchase
            <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    )
  }

  // Helper to render a package option that IS PAYGO
  const renderPaygoPackageOption = (tutoringPackage: TutoringPackage) => {
    const hours = tutoringPackage.individual_curriculum_hours ? currPaygoHours : testPrepPaygoHours
    const updateHours = tutoringPackage.individual_curriculum_hours ? setCurrPaygoHours : setTestPrepPaygoHours
    return (
      <div className="package-option flex">
        <div className="hours">
          <Button
            type="default"
            shape="circle"
            onClick={() => updateHours(hours - 1)}
            disabled={hours < 2}
            icon={<MinusOutlined />}
          />
          {hours}
          &nbsp;Hours
          <Button
            type="default"
            shape="circle"
            onClick={() => updateHours(hours + 1)}
            disabled={hours > 8}
            icon={<PlusOutlined />}
          />
        </div>
        <div className="price">${tutoringPackage.price * hours}</div>
        <div className="purchase">
          <Button type="primary" onClick={_ => setSelectedPackage(tutoringPackage.pk)}>
            Purchase
            <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    )
  }

  /** Helper to get hours to be purchased and total cost given selected package and hours */
  const getHoursAndPrice = () => {
    const selectedPackageObject = filteredPackageOptions.find(p => p.pk === selectedPackage)
    if (!selectedPackageObject) {
      return { hoursToPurchase: null, price: null }
    }
    // We can assume that either we're purchasing curriculum hours or test prep hours
    let hoursToPurchase =
      selectedPackageObject.individual_curriculum_hours + selectedPackageObject.individual_test_prep_hours
    let { price } = selectedPackageObject
    if (selectedPackageObject.pk === paygoCurriculumPackage?.pk) {
      hoursToPurchase = currPaygoHours
      price *= hoursToPurchase
    } else if (selectedPackageObject.pk === paygoTestPrepPackage?.pk) {
      hoursToPurchase = testPrepPaygoHours
      price *= hoursToPurchase
    }
    return { hoursToPurchase, price }
  }

  // Perform purchase of selected package
  const doPurchase = () => {
    const { hoursToPurchase, price } = getHoursAndPrice()
    if (!(hoursToPurchase && price && selectedPackage)) {
      throw new Error('Attempting to confirm purchase without product selected')
    }
    setPurchasing(true)
    dispatch(
      createTutoringPackagePurchase({
        student: studentID,
        execute_charge: true,
        tutoring_package: selectedPackage,
        hours: hoursToPurchase,
      }),
    )
      .then(_ => {
        if (onPurchase) onPurchase()
        dispatch(closeModal())
      })
      .catch(e => (e.response ? message.warning(e.response.data.detail) : ''))
      .finally(() => setPurchasing(false))
  }

  // A package has been selected. Confirm
  const renderConfirm = () => {
    const { hoursToPurchase, price } = getHoursAndPrice()
    const selectedPackageObject = filteredPackageOptions.find(p => p.pk === selectedPackage)
    if (!(selectedPackageObject && hoursToPurchase && price)) return ''
    return (
      <div className="confirmation">
        <p className="instructions">
          You are purchasing {hoursToPurchase} hour{hoursToPurchase > 1 && 's'}.
        </p>
        {hasTransactionID && (
          <div>
            <p className="instructions">You will be charged ${price}</p>
            <p>
              <Button loading={purchasing} type="primary" size="large" onClick={doPurchase}>
                Confirm <CheckCircleFilled />
              </Button>
            </p>
          </div>
        )}
        {!hasTransactionID && (
          <Button size="large" href={selectedPackageObject.magento_purchase_link} target="_blank">
            Complete Order <ArrowRightOutlined />
          </Button>
        )}
        <p className="back">
          <Button type="link" onClick={_ => setSelectedPackage(undefined)}>
            Return to package selection
          </Button>
        </p>
      </div>
    )
  }

  // Different tutor pricing available. Allow selecting which tutor hours are being purchased for
  const renderSelectTutor = () => {
    return (
      <div className="select-tutor">
        <label>Select tutor:</label>
        <Select
          value={selectedTutor || -1}
          onChange={v => setSelectedTutor(v === -1 ? null : v)}
          showSearch={true}
          optionFilterProp="children"
        >
          {tutorsWithPricing.map(t => (
            <Select.Option value={t.pk} key={t.slug}>
              {getFullName(t)}
            </Select.Option>
          ))}
          {tutorsWithPricing.length < studentTutors.length && <Select.Option value={-1}>Other Tutors</Select.Option>}
        </Select>
      </div>
    )
  }

  return (
    <div className={styles.purchaseIndividualTutoringPackage}>
      {selectedPackage && renderConfirm()}
      {!selectedPackage && (
        <div className="select-package">
          <p className="instructions">Select a package of hours from the options below</p>
          {requireSelectTutor && renderSelectTutor()}
          <div className="test-prep-container">
            <div className="header">Test Prep</div>
            {loading && <Skeleton />}
            {paygoTestPrepPackage && hasTransactionID && renderPaygoPackageOption(paygoTestPrepPackage)}
            {testPrepPackages.map(renderPackageOption)}
          </div>
          <div className="curriculum-container">
            <div className="header">Curriculum</div>
            {loading && <Skeleton />}
            {paygoCurriculumPackage && hasTransactionID && renderPaygoPackageOption(paygoCurriculumPackage)}
            {currPackages.map(renderPackageOption)}
          </div>
        </div>
      )}
    </div>
  )
}
export default PurchaseIndividualTutoringPackage
