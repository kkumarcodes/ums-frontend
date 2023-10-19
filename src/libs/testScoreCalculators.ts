import { TestResult } from 'store/diagnostic/diagnosticTypes'

export const calculateSATSuperscore = (satTests: TestResult[]) => {
  let maxReading = 0
  let maxMath = 0
  satTests.forEach(sat => {
    if (sat.reading > maxReading) {
      maxReading = sat.reading
    }
    if (sat.math > maxMath) {
      maxMath = sat.math
    }
  })
  return maxReading + maxMath
}

export const calculateACTSuperscore = (actTests: TestResult[]) => {
  let maxReading = 0
  let maxMath = 0
  let maxEnglish = 0
  let maxScience = 0

  actTests.forEach(act => {
    if (act.reading > maxReading) {
      maxReading = act.reading
    }
    if (act.math > maxMath) {
      maxMath = act.math
    }
    if (act.english > maxEnglish) {
      maxEnglish = act.english
    }
    if (act.science > maxScience) {
      maxScience = act.science
    }
  })
  return Math.round((maxReading + maxMath + maxEnglish + maxScience) / 4)
}
