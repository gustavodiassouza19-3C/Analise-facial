import { motion, useReducedMotion } from "framer-motion"

// Shared easing curves
const easeOutExpo = [0.16, 1, 0.3, 1]
const easeOutQuart = [0.25, 1, 0.5, 1]
const springSmooth = { type: "spring", stiffness: 300, damping: 30 }

// ============ Page Transition ============

function PageTransition({ children, className }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{
        duration: prefersReduced ? 0.1 : 0.4,
        ease: easeOutExpo,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============ Stagger (immediate, no scroll) ============

function StaggerContainer({ children, className, delay = 0.1 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReduced ? 0 : 0.06,
            delayChildren: prefersReduced ? 0 : delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerItem({ children, className }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: prefersReduced ? {} : { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: easeOutExpo }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============ Reusable animated wrappers ============

function FadeIn({ children, className, delay = 0 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: prefersReduced ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScaleIn({ children, className, delay = 0 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: easeOutExpo,
        delay: prefersReduced ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SlideInLeft({ children, className, delay = 0 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.5,
        ease: easeOutExpo,
        delay: prefersReduced ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SlideInRight({ children, className, delay = 0 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.5,
        ease: easeOutExpo,
        delay: prefersReduced ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============ Scroll-Triggered Components ============

function ScrollFadeUp({ children, className, amount = 0.3 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, ease: easeOutQuart }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollScaleUp({ children, className, amount = 0.3 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, scale: 0.92, y: 24 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, ease: easeOutExpo }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollSlideLeft({ children, className, amount = 0.3 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, ease: easeOutExpo }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollSlideRight({ children, className, amount = 0.3 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, ease: easeOutExpo }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollRotateCard({ children, className, amount = 0.8 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 200, rotate: 8 }}
      whileInView={{ opacity: 1, y: 40, rotate: -8 }}
      viewport={{ once: true, amount }}
      transition={springSmooth}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============ Stagger on Scroll ============

function ScrollStaggerContainer({ children, className, amount = 0.2 }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReduced ? 0 : 0.12,
            delayChildren: prefersReduced ? 0 : 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollStaggerItem({ children, className }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: prefersReduced ? {} : { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, ease: easeOutQuart }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  ScaleIn,
  SlideInLeft,
  SlideInRight,
  ScrollFadeUp,
  ScrollScaleUp,
  ScrollSlideLeft,
  ScrollSlideRight,
  ScrollRotateCard,
  ScrollStaggerContainer,
  ScrollStaggerItem,
}
