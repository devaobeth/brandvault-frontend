import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/features/auth/context'
import { fieldClass as baseFieldClass } from '@/shared/lib/formField'

type FieldErrors = {
  name?: string
  email?: string
  password?: string
  passwordConfirmation?: string
}

function fieldClass(hasError: boolean) {
  return baseFieldClass(hasError, 'mt-1.5')
}

function apiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    const firstField = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined
    return firstField || body?.message || fallback
  }
  return fallback
}

export function LoginPage() {
  const { login, register, continueAsDemo } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function clearErrors() {
    setFieldErrors({})
    setFormError(null)
  }

  function validate(): boolean {
    const next: FieldErrors = {}

    if (mode === 'register' && !name.trim()) {
      next.name = 'Name is required.'
    }

    if (!email.trim()) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.'
    }

    if (!password) {
      next.password = 'Password is required.'
    } else if (mode === 'register' && password.length < 8) {
      next.password = 'Password must be at least 8 characters.'
    }

    if (mode === 'register') {
      if (!passwordConfirmation) {
        next.passwordConfirmation = 'Confirm your password.'
      } else if (passwordConfirmation !== password) {
        next.passwordConfirmation = 'Passwords do not match.'
      }
    }

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!validate()) {
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register(name.trim(), email.trim(), password, passwordConfirmation)
      }
      navigate('/assets')
    } catch (err) {
      setFormError(
        apiErrorMessage(
          err,
          mode === 'login' ? 'Invalid credentials.' : 'Could not create account.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDemo() {
    clearErrors()
    setSubmitting(true)
    try {
      await continueAsDemo()
      navigate('/assets')
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Demo login failed. Is the API running?'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">BrandVault</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login' ? 'Sign in to your workspace' : 'Create a new account'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {mode === 'register' ? (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="auth-name"
                className={fieldClass(Boolean(fieldErrors.name))}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: undefined }))
                  }
                }}
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'auth-name-error' : undefined}
              />
              {fieldErrors.name ? (
                <p id="auth-name-error" className="mt-1.5 text-xs text-red-600">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              className={fieldClass(Boolean(fieldErrors.email))}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }
              }}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
            />
            {fieldErrors.email ? (
              <p id="auth-email-error" className="mt-1.5 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className={fieldClass(Boolean(fieldErrors.password))}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }))
                }
              }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
            />
            {fieldErrors.password ? (
              <p id="auth-password-error" className="mt-1.5 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {mode === 'register' ? (
            <div>
              <label
                htmlFor="auth-password-confirmation"
                className="block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <input
                id="auth-password-confirmation"
                type="password"
                className={fieldClass(Boolean(fieldErrors.passwordConfirmation))}
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value)
                  if (fieldErrors.passwordConfirmation) {
                    setFieldErrors((prev) => ({ ...prev, passwordConfirmation: undefined }))
                  }
                }}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.passwordConfirmation)}
                aria-describedby={
                  fieldErrors.passwordConfirmation ? 'auth-password-confirmation-error' : undefined
                }
              />
              {fieldErrors.passwordConfirmation ? (
                <p id="auth-password-confirmation-error" className="mt-1.5 text-xs text-red-600">
                  {fieldErrors.passwordConfirmation}
                </p>
              ) : null}
            </div>
          ) : null}

          {formError ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleDemo()}
          className="mt-3 w-full cursor-pointer rounded-md border border-slate-300 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue as demo
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button
                type="button"
                className="cursor-pointer font-medium text-slate-900 underline"
                onClick={() => {
                  setMode('register')
                  clearErrors()
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="cursor-pointer font-medium text-slate-900 underline"
                onClick={() => {
                  setMode('login')
                  clearErrors()
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-600 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
