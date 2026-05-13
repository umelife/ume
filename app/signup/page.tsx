'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/mixpanel/client'
import UsernameInput from '@/components/auth/UsernameInput'
import AddressInput from '@/components/auth/AddressInput'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface PasswordRequirements {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

type AccountType = 'student' | 'personal' | 'organization'

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>('student')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState(false)
  const [collegeName, setCollegeName] = useState('')
  const [collegeAddress, setCollegeAddress] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const router = useRouter()

  const isStudent = accountType === 'student'

  // Validate password requirements
  const validatePassword = (pwd: string): PasswordRequirements => {
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    }
  }

  const requirements = validatePassword(password)
  const allRequirementsMet = Object.values(requirements).every(req => req)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    if (confirmPassword) {
      setPasswordsMatch(newPassword === confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value
    setConfirmPassword(newConfirmPassword)
    setPasswordsMatch(password === newConfirmPassword)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate username
    if (!username || !usernameAvailable) {
      setError('Please enter a valid and available username')
      setLoading(false)
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setPasswordsMatch(false)
      setLoading(false)
      return
    }

    // Validate all requirements are met
    if (!allRequirementsMet) {
      setError('Please meet all password requirements')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    if (isStudent) {
      if (!collegeName.trim()) {
        setError('College name is required')
        setLoading(false)
        return
      }
      if (!collegeAddress.trim()) {
        setError('College address is required')
        setLoading(false)
        return
      }
    } else {
      if (!displayName.trim()) {
        setError('Display name is required')
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username,
          accountType,
          collegeName: isStudent ? collegeName.trim() : undefined,
          collegeAddress: isStudent ? collegeAddress.trim() : undefined,
          displayName: !isStudent ? displayName.trim() : undefined,
          orgName: accountType === 'organization' ? orgName.trim() : undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }

      trackEvent('signup_success', { email, username, accountType })

      setUserEmail(email)
      setSuccess(true)
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f3f7f8] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-10 pb-10 px-8 text-center space-y-4">
            <div
              className="mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-2"
              style={{ backgroundColor: '#eef0ff' }}
            >
              <svg className="h-7 w-7" style={{ color: '#130170' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We sent a verification link to{' '}
              <span className="font-semibold text-gray-900">{userEmail}</span>.
              Click it to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: '#130170' }}
            >
              Go to log in
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f7f8] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-xl">

        {/* Left brand panel — hidden on mobile */}
        <div
          className="hidden md:flex flex-col justify-between w-[40%] p-10"
          style={{ backgroundColor: '#130170' }}
        >
          <div>
            <div className="text-4xl font-extrabold tracking-tight">
              <span className="text-white">U</span>
              <span style={{ color: '#fa9ebc' }}>ME</span>
            </div>
            <p className="mt-3 text-sm font-medium" style={{ color: '#fa9ebc' }}>
              University Marketplace Exchange
            </p>
          </div>

          <div className="space-y-6">
            <ul className="space-y-4 text-white/80 text-sm">
              {[
                'Post listings in seconds',
                'Connect with students on campus',
                'Safe, verified university emails only',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#fa9ebc' }}
                  >
                    <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <div className="h-1 w-8 rounded-full" style={{ backgroundColor: '#fa9ebc' }} />
              <div className="h-1 w-4 rounded-full bg-white/30" />
              <div className="h-1 w-4 rounded-full bg-white/30" />
            </div>
          </div>

          <p className="text-white/40 text-xs">© {new Date().getFullYear()} UME. All rights reserved.</p>
        </div>

        {/* Right form panel */}
        <Card className="flex-1 rounded-none border-0 shadow-none bg-white overflow-y-auto max-h-screen">
          <CardHeader className="pt-10 pb-4 px-8">
            {/* Mobile logo */}
            <div className="md:hidden text-center mb-2">
              <span className="text-3xl font-extrabold" style={{ color: '#130170' }}>U</span>
              <span className="text-3xl font-extrabold" style={{ color: '#fa9ebc' }}>ME</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Create your account</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Join your campus marketplace today
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Account type toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">I am signing up as</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('student')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                      isStudent
                        ? 'bg-[#130170] text-white border-[#130170]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#130170]'
                    }`}
                  >
                    🎓 A Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType(accountType === 'student' ? 'personal' : accountType)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                      !isStudent
                        ? 'bg-[#130170] text-white border-[#130170]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#130170]'
                    }`}
                  >
                    👤 Personal / Org
                  </button>
                </div>
                {!isStudent && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setAccountType('personal')}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        accountType === 'personal'
                          ? 'bg-[#fa9ebc] text-white border-[#fa9ebc]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#fa9ebc]'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('organization')}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        accountType === 'organization'
                          ? 'bg-[#fa9ebc] text-white border-[#fa9ebc]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#fa9ebc]'
                      }`}
                    >
                      Organization
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Username */}
              <div className="space-y-1.5">
                <UsernameInput
                  value={username}
                  onChange={setUsername}
                  onAvailabilityChange={setUsernameAvailable}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {isStudent ? 'University Email Address' : 'Email Address'}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder={isStudent ? 'you@university.edu' : 'you@example.com'}
                  className="rounded-lg border-gray-300 focus-visible:ring-[#130170]"
                />
              </div>

              {/* Student-only fields */}
              {isStudent && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="collegeName" className="text-sm font-medium text-gray-700">College Name</Label>
                    <Input
                      id="collegeName"
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="e.g., University of the Cumberlands"
                      className="rounded-lg border-gray-300 focus-visible:ring-[#130170]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <AddressInput value={collegeAddress} onChange={setCollegeAddress} required />
                  </div>
                </>
              )}

              {/* Non-student fields */}
              {!isStudent && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={accountType === 'organization' ? 'Your organization name' : 'Your full name'}
                      className="rounded-lg border-gray-300 focus-visible:ring-[#130170]"
                    />
                  </div>
                  {accountType === 'organization' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="orgName" className="text-sm font-medium text-gray-700">Organization Name</Label>
                      <Input
                        id="orgName"
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g., Campus Coffee Co."
                        className="rounded-lg border-gray-300 focus-visible:ring-[#130170]"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Nashville"
                        className="rounded-lg border-gray-300 focus-visible:ring-[#130170]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
                      <Input
                        id="state"
                        type="text"
                        maxLength={2}
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        placeholder="TN"
                        className="rounded-lg border-gray-300 focus-visible:ring-[#130170]"
                      />
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Create Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    className="rounded-lg border-gray-300 focus-visible:ring-[#130170] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password requirements */}
                {password && (
                  <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1.5">
                    <p className="text-xs font-medium text-gray-600">Password must contain:</p>
                    <div className="grid grid-cols-1 gap-1">
                      <PasswordRequirement met={requirements.minLength} text="At least 8 characters" />
                      <PasswordRequirement met={requirements.hasUppercase} text="One uppercase letter (A-Z)" />
                      <PasswordRequirement met={requirements.hasLowercase} text="One lowercase letter (a-z)" />
                      <PasswordRequirement met={requirements.hasNumber} text="One number (0-9)" />
                      <PasswordRequirement met={requirements.hasSpecialChar} text="One special character (!@#$%^&*)" />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Re-enter your password"
                    className={`rounded-lg pr-10 focus-visible:ring-[#130170] ${
                      confirmPassword && !passwordsMatch
                        ? 'border-red-400 focus-visible:ring-red-400'
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-600 font-medium mt-1">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  loading ||
                  !allRequirementsMet ||
                  !passwordsMatch ||
                  !confirmPassword ||
                  !usernameAvailable ||
                  (isStudent && (!collegeName.trim() || !collegeAddress.trim())) ||
                  (!isStudent && !displayName.trim())
                }
                className="w-full h-11 rounded-lg text-sm font-semibold text-white mt-2"
                style={{ backgroundColor: '#130170' }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-gray-400">OR</span>
                <Separator className="flex-1" />
              </div>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold transition-colors hover:opacity-80"
                  style={{ color: '#130170' }}
                >
                  Log in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Password Requirement Component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-200 ${
          met ? '' : 'bg-gray-200'
        }`}
        style={met ? { backgroundColor: '#130170' } : {}}
      >
        {met && (
          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-xs transition-colors duration-200 ${met ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  )
}
