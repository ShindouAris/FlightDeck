import { BrowserRouter, Routes, Route } from 'react-router'
import { FocusFlight } from '@/components/FocusFlight'
import './App.css'
import { DemoRender} from '@/components/TicketRender'
function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FocusFlight />} />
        <Route path="/demo" element={<DemoRender />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
