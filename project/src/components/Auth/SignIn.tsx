import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Gamepad2, X } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';

interface SignInProps {
  onSignIn: (email: string, password: string) => void;
  onSwitchToSignUp: () => void;
  isLoading?: boolean;
}

export const SignIn: React.FC<SignInProps> = ({ onSignIn, onSwitchToSignUp, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; firebase?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ success?: string; error?: string }>({});
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSignIn(email, password); // Notify parent for navigation
    } catch (error: any) {
      // User-friendly error messages
      let message = 'Invalid email or password. Please try again.';
      if (error.code === 'auth/user-not-found') message = 'No user found with this email.';
      else if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
      else if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
      setErrors(prev => ({ ...prev, firebase: message }));
    } finally {
      setLoading(false);
    }
  };

  // Google login handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({});
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Optionally, you can call onSignIn with Google user info if needed
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      let message = 'Google sign-in failed. ';
      if (error.code === 'auth/operation-not-allowed') {
        message = 'Google sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in methods → Google.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in was cancelled.';
      } else {
        message += error.message || 'Unknown error occurred.';
      }
      setErrors(prev => ({ ...prev, firebase: message }));
    } finally {
      setLoading(false);
    }
  };

  // Password reset handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus({});
    setResetLoading(true);
    try {
      console.log('Sending password reset email to:', resetEmail);
      await sendPasswordResetEmail(auth, resetEmail);
      console.log('Password reset email sent successfully');
      setResetStatus({ success: 'Password reset email sent! Check your inbox (and spam folder).' });
    } catch (error: any) {
      console.error('Password reset error:', error);
      let msg = 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') msg = 'No user found with this email.';
      if (error.code === 'auth/invalid-email') msg = 'Invalid email address.';
      if (error.code === 'auth/too-many-requests') msg = 'Too many requests. Try again later.';
      setResetStatus({ error: msg + ' (Check console for details)' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gray-900 overflow-hidden">
      {/* Chess Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/src/assets/chess-background.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7)'
        }}
      />

      {/* Glassmorphism Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Close button */}
          <div className="absolute top-4 right-4">
            <button className="text-gray-300 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-gray-700 rounded-full">
                <Gamepad2 className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white">SK CHESS</h1>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-gray-300">Sign in to your account to continue playing</p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2 mb-6 border border-gray-600 rounded-lg bg-white hover:bg-gray-100 transition-all shadow focus:outline-none disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48"><g><path d="M44.5 20H24v8.5h11.7C34.7 33.1 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.3-.1-2.7-.3-4z" fill="#FFC107"/><path d="M6.3 14.7l7 5.1C15.5 17.1 19.4 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z" fill="#FF3D00"/><path d="M24 45c5.1 0 9.8-1.7 13.5-4.7l-6.2-5.1C29.2 36.7 26.7 37.5 24 37.5c-6.1 0-10.7-3.9-12.5-9.1l-7 5.4C7.9 41.6 15.4 45 24 45z" fill="#4CAF50"/><path d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.2 5.5-7.7 5.5-2.2 0-4.2-.7-5.7-2.1l-7 5.4C15.4 41.6 19.4 45 24 45c10.5 0 20-7.7 20-21 0-1.3-.1-2.7-.3-4z" fill="#1976D2"/></g></svg>
            <span className="text-gray-800 font-medium">Sign in with Google</span>
          </button>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.firebase && (
              <div className="text-red-400 text-center text-sm font-medium mb-2">{errors.firebase}</div>
            )}
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-gray-700 border ${
                      errors.email ? 'border-red-400' : 'border-gray-600'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-300">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 bg-gray-700 border ${
                      errors.password ? 'border-red-400' : 'border-gray-600'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-300">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-blue-400 hover:text-blue-200 transition-colors"
                  onClick={() => setShowResetModal(true)}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading || loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {isLoading || loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-300">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="font-medium text-blue-400 hover:text-blue-200 transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => {
                setShowResetModal(false);
                setResetEmail('');
                setResetStatus({});
              }}
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2 text-center">Reset Password</h3>
            <p className="text-gray-300 text-sm mb-4 text-center">Enter your email to receive a password reset link.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Email address"
              />
              {resetStatus.error && <div className="text-red-400 text-sm text-center">{resetStatus.error}</div>}
              {resetStatus.success && <div className="text-green-400 text-sm text-center">{resetStatus.success}</div>}
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
              >
                {resetLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 