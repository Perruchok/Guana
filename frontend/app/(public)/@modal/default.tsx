// app/(public)/@modal/default.tsx
// Required for parallel routes: renders nothing when the current URL does
// not match an intercepted route inside @modal (i.e. most of the time).

export default function Default() {
  return null
}
