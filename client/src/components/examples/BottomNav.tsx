import { useState } from 'react'
import BottomNav from '../BottomNav'

export default function BottomNavExample() {
  const [active, setActive] = useState('home')
  
  return (
    <div className="h-screen relative">
      <BottomNav active={active} onNavigate={setActive} />
    </div>
  )
}
