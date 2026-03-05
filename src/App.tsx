import { BrowserRouter, Routes, Route } from 'react-router'
import { FocusFlight } from '@/components/FocusFlight'
import './App.css'
import { DemoRender} from '@/components/TicketRender'
import { RenderActionBar } from '@/components/ActionBar'
import Settings from './components/Settings'
function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FocusFlight />} />
        <Route path="/demo" element={<DemoRender />} />
        <Route path='/actionbar' element={<RenderActionBar />} />
        <Route path='/settings' element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
