// Runs the date-handling tests under several timezones. Event dates are
// calendar dates, and a bug that treats them as instants only shows up away
// from UTC (where CI and most laptops-in-the-cloud run). See "How dates work
// here" at the top of src/utils/dateUtils.js.
import { spawnSync } from 'node:child_process'

const ZONES = [
  'UTC',
  'America/Los_Angeles', // UTC-8/-7, US DST
  'Pacific/Pago_Pago', // UTC-11
  'Europe/London', // UTC+0/+1, EU DST
  'Asia/Kolkata', // UTC+5:30
  'Pacific/Kiritimati', // UTC+14
]
const FILES = [
  'src/utils/__tests__/dateUtils.test.js',
  'src/utils/__tests__/dateUtils.tz.test.js',
  'src/utils/__tests__/exportHelpers.test.js',
  'src/utils/__tests__/importHelpers.test.js',
  'src/store/__tests__/selectors.test.js',
]

let failed = []
for (const tz of ZONES) {
  console.log(`\n── TZ=${tz}`)
  const run = spawnSync('npx', ['vitest', 'run', ...FILES], {
    stdio: 'inherit',
    env: { ...process.env, TZ: tz },
  })
  if (run.status !== 0) failed.push(tz)
}
if (failed.length > 0) {
  console.error(`\nDate tests failed in: ${failed.join(', ')}`)
  process.exit(1)
}
console.log(`\nDate tests passed in all ${ZONES.length} timezones`)
