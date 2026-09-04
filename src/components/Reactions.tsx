import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function Reactions() {
  const { reactions, removeReaction } = useStore()

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: '90vh', scale: 0.5, x: `${r.x}vw` }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: '10vh',
              scale: [0.5, 1.4, 1.1, 0.8],
              x: [`${r.x}vw`, `${r.x + (Math.random() * 8 - 4)}vw`]
            }}
            transition={{ duration: 2.8, ease: 'easeOut' }}
            onAnimationComplete={() => removeReaction(r.id)}
            className="absolute text-5xl filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] select-none"
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
