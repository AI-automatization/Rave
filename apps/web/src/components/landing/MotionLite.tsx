import {
  Fragment,
  createElement,
  type ElementType,
  type ReactNode,
} from 'react';

/**
 * Landing-page motion compatibility layer.
 *
 * The previous homepage hydrated Framer Motion for every decorative reveal and
 * kept dozens of infinite JavaScript animations alive. The landing page only
 * needs semantic HTML and its existing CSS hover/focus transitions for the
 * acquisition experience, so this adapter intentionally drops motion-only
 * props while preserving semantic DOM props.
 */
type MotionProps = Record<string, unknown> & { children?: ReactNode };

function staticElement(tag: ElementType) {
  return function StaticMotionElement({
      animate: _animate,
      initial: _initial,
      exit: _exit,
      variants: _variants,
      transition: _transition,
      viewport: _viewport,
      whileHover: _whileHover,
      whileInView: _whileInView,
      whileTap: _whileTap,
      layout: _layout,
      children,
      ...domProps
    }: MotionProps) {
    return createElement(tag, domProps, children);
  };
}

export const motion = {
  a: staticElement('a'),
  div: staticElement('div'),
  h1: staticElement('h1'),
  h2: staticElement('h2'),
  p: staticElement('p'),
  span: staticElement('span'),
  ul: staticElement('ul'),
};

export function AnimatePresence({ children }: { children: ReactNode; mode?: string }) {
  return <Fragment>{children}</Fragment>;
}

// Decorative motion is deliberately disabled for this performance workstream.
export function useReducedMotion() {
  return true;
}

export type Variants = Record<string, Record<string, unknown>>;
