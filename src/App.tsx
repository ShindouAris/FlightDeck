import { BrowserRouter, Routes, Route } from 'react-router'
import { ThemeProvider } from 'next-themes'
import { FocusFlight } from '@/components/FocusFlight'
import './App.css'
import { TicketPrint } from '@/components/TicketRender'
import { RenderActionBar } from '@/components/ActionBar'
import Settings from './components/Settings'
import SeatSelection from './components/SeatSelection'
function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FocusFlight />} />
          <Route path="/print" element={<TicketPrint />} />
          <Route path='/actionbar' element={<RenderActionBar />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/seat' element={<SeatSelection />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
