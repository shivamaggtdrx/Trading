import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const tabOrder = {
  '/': 0,
  '/markets': 0,
  '/charts': 1,
  '/positions': 2,
  '/orders': 3,
  '/wallet': 4,
  '/profile': 5,
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const [direction, setDirection] = useState(0); // 1 = right-to-left, -1 = left-to-right
  const [prevIndex, setPrevIndex] = useState(tabOrder[location.pathname] ?? 0);

  useEffect(() => {
    const currentIndex = tabOrder[location.pathname];
    if (currentIndex !== undefined && prevIndex !== undefined) {
      if (currentIndex > prevIndex) {
        setDirection(1);
      } else if (currentIndex < prevIndex) {
        setDirection(-1);
      }
    } else {
      setDirection(1);
    }
    if (currentIndex !== undefined) {
      setPrevIndex(currentIndex);
    }
  }, [location.pathname, prevIndex]);

  const variants = {
    initial: (dir) => ({
      x: dir === 1 ? 40 : dir === -1 ? -40 : 0,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir) => ({
      x: dir === 1 ? -40 : dir === -1 ? 40 : 0,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
