import { useState } from 'react'
import TimePeriodSelector from '../TimePeriodSelector'

export default function TimePeriodSelectorExample() {
  const [period, setPeriod] = useState('This Month')
  
  return (
    <div className="p-4">
      <TimePeriodSelector value={period} onChange={setPeriod} />
    </div>
  )
}
