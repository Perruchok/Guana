"use client"
import { useEffect } from 'react'

export default function RemoveUndefinedStyle() {
  useEffect(() => {
    const clean = () => {
      const styles = Array.from(document.querySelectorAll('style'))
      styles.forEach((node) => {
        if (node.textContent?.trim() === 'undefined') node.remove()
      })
    }
    // run once
    clean()
    // observe head for newly injected style tags
    const obs = new MutationObserver(() => clean())
    obs.observe(document.head, { childList: true })
    return () => obs.disconnect()
  }, [])
  return null
}
