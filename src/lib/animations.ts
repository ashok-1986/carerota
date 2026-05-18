import { Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.2, ease: "easeOut" } 
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: "easeOut" } 
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const cellHover = {
  whileHover: { scale: 1.04 },
  transition: { duration: 0.12 },
};

export const listItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

