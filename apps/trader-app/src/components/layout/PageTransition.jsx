import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

const tabOrder = {
  '/': 0,
  '/markets': 0,
  '/charts': 1,
  '/positions': 2,
  '/orders': 3,
  '/wallet': 4,
  '/profile': 5,
};

export default function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [direction, setDirection] = useState(0); 
  const prevIndexRef = useRef(tabOrder[location.pathname] ?? 0);

  useEffect(() => {
    const currentIndex = tabOrder[location.pathname];
    if (currentIndex !== undefined) {
      if (currentIndex > prevIndexRef.current) {
        setDirection(1);
      } else if (currentIndex < prevIndexRef.current) {
        setDirection(-1);
      }
      prevIndexRef.current = currentIndex;
    }
  }, [location.pathname]);

  const variants = {
    initial: (dir) => ({
      x: dir === 1 ? '100%' : dir === -1 ? '-100%' : 0,
    }),
    animate: {
      x: 0,
      transition: {
        type: 'spring', stiffness: 400, damping: 40
      },
    },
    exit: (dir) => ({
      x: dir === 1 ? '-100%' : dir === -1 ? '100%' : 0,
      transition: {
        type: 'spring', stiffness: 400, damping: 40
      },
    }),
  };

  return (
    <MotionConfig reducedMotion="never">
      <div className="relative w-full h-full overflow-hidden flex-1 flex flex-col">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full bg-surface z-10"
            style={{ touchAction: 'pan-y' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
