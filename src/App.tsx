import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Lobby from './components/Lobby'
import Theater from './components/Theater'

export default function App() {
  const { roomCode, theme } = useStore()

  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  return (
    <main className="w-full h-screen bg-[var(--bg)] text-[var(--text-main)] overflow-hidden relative select-none">
      {roomCode ? <Theater /> : <Lobby />}
    </main>
  )
}
