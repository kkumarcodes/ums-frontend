// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Col, Row, Statistic } from 'antd'
import { CreateTestResultButton } from 'components/student/CreateTestResultButton'
import { TestResultTable } from 'components/student/TestResultTable'
import { calculateACTSuperscore, calculateSATSuperscore } from 'libs'
import useActiveStudent from 'libs/useActiveStudent'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectTestResults } from 'store/diagnostic/diagnosticSelectors'
import { TestType } from 'store/diagnostic/diagnosticTypes'
import { selectIsParent } from 'store/user/usersSelector'

type Props = {
  student?: number
  readOnly?: boolean
}

export const TestResultPage = ({ student, readOnly = false }: Props) => {
  const activeStudent = useActiveStudent()
  const isParent = useSelector(selectIsParent)
  readOnly = readOnly || !!isParent
  const studentPK = student || activeStudent?.pk

  const [satSuperscore, setSATSuperscore] = useState(0)
  const [actSuperscore, setACTSuperscore] = useState(0)

  // Note: This page expects that TestResultTable will fetch the testResults
  const testResults = useSelector(selectTestResults).filter(tr => (studentPK ? tr.student === studentPK : true))

  const satTests = testResults.filter(test => test.test_type === TestType.SAT)
  const satTestCount = satTests.length
  const actTests = testResults.filter(test => test.test_type === TestType.ACT)
  const actTestsCount = actTests.length

  useEffect(() => {
    if (satTestCount >= 2) {
      setSATSuperscore(calculateSATSuperscore(satTests))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satTestCount, JSON.stringify(satTests)])

  useEffect(() => {
    if (actTestsCount >= 2) {
      setACTSuperscore(calculateACTSuperscore(actTests))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actTestsCount, JSON.stringify(actTests)])

  return (
    <div>
      <Row gutter={16}>
        {!!satSuperscore && (
          <Col span={6}>
            <Statistic formatter={v => v.toString()} title="SAT Superscore" value={satSuperscore} />
          </Col>
        )}
        {!!actSuperscore && (
          <Col span={6}>
            <Statistic formatter={v => v.toString()} title="ACT Superscore" value={actSuperscore} />
          </Col>
        )}
        <Col offset={(Number(!satSuperscore) + Number(!actSuperscore)) * 6} span={12}>
          <div>{!readOnly && studentPK && <CreateTestResultButton studentPK={studentPK} />}</div>
        </Col>
      </Row>
      <br />
      <TestResultTable studentPK={studentPK} />
    </div>
  )
}
