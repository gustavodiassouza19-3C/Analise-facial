import { motion } from "framer-motion"

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: [0.55, 0.06, 0.68, 0.19],
    },
  },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

function PageTransition({ children, className }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerContainer({ children, className }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerItem({ children, className }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

function FadeIn({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.5, ease: "easeOut", delay },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScaleIn({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SlideInLeft({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SlideInRight({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * ============ Scroll-Triggered Variants ============
 */

const scrollFadeUp = {
  offscreen: { opacity: 0, y: 60 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 0.8,
    },
  },
}

const scrollScaleUp = {
  offscreen: { opacity: 0, scale: 0.85, y: 40 },
  onscreen: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.35,
      duration: 0.9,
    },
  },
}

const scrollSlideLeft = {
  offscreen: { opacity: 0, x: -80, y: 30 },
  onscreen: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 0.8,
    },
  },
}

const scrollSlideRight = {
  offscreen: { opacity: 0, x: 80, y: 30 },
  onscreen: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 0.8,
    },
  },
}

const scrollRotateIn = {
  offscreen: { opacity: 0, y: 300, rotate: 10 },
  onscreen: {
    opacity: 1,
    y: 50,
    rotate: -10,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8,
    },
  },
}

/**
 * ============ Scroll-Triggered Components ============
 */

function ScrollFadeUp({ children, className, amount = 0.3 }) {
  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount }}
      variants={scrollFadeUp}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollScaleUp({ children, className, amount = 0.3 }) {
  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount }}
      variants={scrollScaleUp}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollSlideLeft({ children, className, amount = 0.3 }) {
  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount }}
      variants={scrollSlideLeft}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollSlideRight({ children, className, amount = 0.3 }) {
  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount }}
      variants={scrollSlideRight}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollRotateCard({ children, className, amount = 0.8 }) {
  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount }}
      variants={scrollRotateIn}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * ============ Stagger on Scroll ============
 */

const scrollStaggerContainer = {
  offscreen: {},
  onscreen: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const scrollStaggerItem = {
  offscreen: { opacity: 0, y: 50 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 0.7,
    },
  },
}

function ScrollStaggerContainer({ children, className, amount = 0.2 }) {
  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount }}
      variants={scrollStaggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScrollStaggerItem({ children, className }) {
  return (
    <motion.div variants={scrollStaggerItem} className={className}>
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
  pageVariants,
  staggerContainer,
  staggerItem,
  fadeIn,
  scaleIn,
  slideInLeft,
  slideInRight,
  scrollFadeUp,
  scrollScaleUp,
  scrollSlideLeft,
  scrollSlideRight,
  scrollRotateIn,
  scrollStaggerContainer,
  scrollStaggerItem,
}
