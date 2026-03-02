import { BrowserRouter, Routes, Route } from 'react-router'
import { FocusFlight } from '@/components/FocusFlight'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FocusFlight />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
