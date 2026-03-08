import { BrowserRouter, Routes, Route } from 'react-router'
import { ThemeProvider } from 'next-themes'
import { FlightDeck } from '@/components/FlightDeck'
import './App.css'
function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FlightDeck />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
