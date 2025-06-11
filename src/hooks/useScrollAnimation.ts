import { useEffect, useRef, useState } from 'react';

interface ScrollAnimationOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

const useScrollAnimation = (options?: ScrollAnimationOptions) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (!currentElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          currentElement.classList.add('is-visible');
          if (options?.triggerOnce) {
            observer.unobserve(currentElement);
          }
        } else {
          if (!options?.triggerOnce) {
            setIsVisible(false);
          }
        }
      },
      {
        threshold: options?.threshold || 0.1,
        rootMargin: options?.rootMargin || '0px',
      }
    );

    observer.observe(currentElement);

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options]);

  const setRef = (node: HTMLElement | null) => {
    elementRef.current = node;
  };

  return { ref: setRef, isVisible };
};

export default useScrollAnimation; 