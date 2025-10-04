import BillsCard from '../BillsCard'

export default function BillsCardExample() {
  return (
    <div className="p-4">
      <BillsCard invoicesDue={3} overdue={1} />
    </div>
  )
}
