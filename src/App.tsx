import { BrowserRouter, Routes, Route } from 'react-router'
import { ThemeProvider } from 'next-themes'
import { FocusFlight } from '@/components/FocusFlight'
import './App.css'
import { DemoRender} from '@/components/TicketRender'
import { RenderActionBar } from '@/components/ActionBar'
import Settings from './components/Settings'
function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FocusFlight />} />
          <Route path="/demo" element={<DemoRender />} />
          <Route path='/actionbar' element={<RenderActionBar />} />
          <Route path='/settings' element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
