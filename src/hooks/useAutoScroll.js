import { useEffect, useRef } from 'react'

export default function useAutoScroll(ref, deps = [], shouldScroll = true) {
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)
  const userScrolledUpRef = useRef(false)
  const lastScrollHeightRef = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Track if user manually scrolled up
    const handleScroll = () => {
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
      if (isAtBottom) {
        userScrolledUpRef.current = false
      } else {
        // Only mark as scrolled up if content height increased (new message)
        if (el.scrollHeight > lastScrollHeightRef.current) {
          userScrolledUpRef.current = true
        }
      }
      lastScrollHeightRef.current = el.scrollHeight
    }

    el.addEventListener('scroll', handleScroll, { passive: true })

    // Clear any pending scroll
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Auto-scroll logic:
    // 1. Always scroll if shouldScroll is true (new message/loading)
    // 2. Only skip if user explicitly scrolled up AND content height increased
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150
    const shouldAutoScroll = shouldScroll && (!userScrolledUpRef.current || isNearBottom)

    if (shouldAutoScroll && !isScrollingRef.current) {
      isScrollingRef.current = true
      
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        el.scrollTo({ 
          top: el.scrollHeight, 
          behavior: 'smooth' 
        })
        
        // Reset scrolling flag after animation completes
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false
          // Reset user scroll flag if we successfully scrolled to bottom
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
            userScrolledUpRef.current = false
          }
        }, 600)
      })
    }

    lastScrollHeightRef.current = el.scrollHeight

    return () => {
      el.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}