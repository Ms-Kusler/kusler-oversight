import MetricCard from '../MetricCard'

export default function MetricCardExample() {
  return (
    <div className="grid md:grid-cols-2 gap-4 p-4">
      <MetricCard 
        title="Money In & Out"
        value="$8,400"
        subtitle="$ 6,200 spent"
        progress={57}
      />
      <MetricCard 
        title="Available Cash"
        value="$12,560"
        subtitle="available"
      />
    </div>
  )
}
