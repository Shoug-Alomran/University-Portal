import { useState, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

type Mode = 'sign-in' | 'sign-up'

function readableAuthError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/operation-not-allowed': 'Enable Email/Password in Firebase Authentication.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/weak-password': 'Use a password with at least six characters.',
  }

  return messages[code] ?? 'Authentication failed. Please try again.'
}

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!auth || !isFirebaseConfigured) {
      setError('Firebase is not configured. Check the values in your .env file.')
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'sign-up') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() })
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (caughtError) {
      setError(readableAuthError(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode)
    setError('')
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <a className="auth-brand" href="/">
          <span className="brand-mark">U</span>
          <span>univ.<b>portal</b></span>
        </a>
        <div>
          <p className="eyebrow">UNIVERSITY PORTAL</p>
          <h1>Everything you need for your semester, in one place.</h1>
          <p>Access courses, schedules, grades, and university services through your secure account.</p>
        </div>
        <small>ACM AI-Assisted Web Engineering Programming Jam</small>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-tabs" aria-label="Authentication mode">
            <button type="button" className={mode === 'sign-in' ? 'active' : ''} onClick={() => changeMode('sign-in')}>Sign in</button>
            <button type="button" className={mode === 'sign-up' ? 'active' : ''} onClick={() => changeMode('sign-up')}>Create account</button>
          </div>

          <div className="auth-heading">
            <p className="eyebrow">{mode === 'sign-in' ? 'WELCOME BACK' : 'GET STARTED'}</p>
            <h2>{mode === 'sign-in' ? 'Sign in to your portal' : 'Create your student account'}</h2>
            <p>{mode === 'sign-in' ? 'Enter your university account details.' : 'Your Firebase account will be created securely.'}</p>
          </div>

          {mode === 'sign-up' && (
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required placeholder="Alex Morgan" />
            </label>
          )}

          <label>
            Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="student@university.edu" />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required placeholder="At least 6 characters" />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="primary auth-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>

          <p className="auth-switch">
            {mode === 'sign-in' ? 'New to the portal?' : 'Already have an account?'}
            <button type="button" onClick={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
              {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}
