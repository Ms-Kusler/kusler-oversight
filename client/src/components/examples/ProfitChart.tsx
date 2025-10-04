import ProfitChart from '../ProfitChart'

export default function ProfitChartExample() {
  const mockData = [
    { value: 3200 },
    { value: 3800 },
    { value: 3500 },
    { value: 4200 },
    { value: 4800 },
    { value: 4300 },
    { value: 5100 }
  ]
  
  return (
    <div className="p-4">
      <ProfitChart percentage={14} trend="up" data={mockData} />
    </div>
  )
}
