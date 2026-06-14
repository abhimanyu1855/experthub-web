const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js"

let razorpayScriptPromise: Promise<void> | null = null

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only be loaded in the browser."))
  }

  if (window.Razorpay) {
    return Promise.resolve()
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`)
      const timeoutId = window.setTimeout(() => {
        reject(new Error("Timed out loading Razorpay checkout."))
      }, 15000)

      const resolveLoaded = () => {
        window.clearTimeout(timeoutId)
        resolve()
      }

      const rejectLoad = () => {
        window.clearTimeout(timeoutId)
        reject(new Error("Unable to load Razorpay checkout."))
      }

      if (existingScript) {
        existingScript.addEventListener("load", resolveLoaded, { once: true })
        existingScript.addEventListener("error", rejectLoad, { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = RAZORPAY_CHECKOUT_SRC
      script.async = true
      script.onload = resolveLoaded
      script.onerror = rejectLoad
      document.body.appendChild(script)
    })
  }

  return razorpayScriptPromise
}
