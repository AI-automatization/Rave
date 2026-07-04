import { type Variants } from 'framer-motion';

// Общие motion-варианты страницы /company (hero, секции, контакты).
export const spring = { type: 'spring' as const, stiffness: 280, damping: 24 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { ...spring, stiffness: 200 } },
};

export const fadeUpScale: Variants = {
  hidden: { opacity: 0, y: 34, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring },
};

export const stagger: Variants = { visible: { transition: { staggerChildren: 0.08 } } };
