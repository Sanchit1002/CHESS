import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Gamepad2, X } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

interface SignUpProps {
  onSignUp: (username: string, email: string, password: string) => void;
  onSwitchToSignIn: () => void;
  isLoading?: boolean;
}

export const SignUp: React.FC<SignUpProps> = ({ onSignUp, onSwitchToSignIn, isLoading = false }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; confirmPassword?: string; firebase?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    if (!username) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return;
    }
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      return;
    }
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Store username in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email,
        username_lower: username.toLowerCase(),
        email_lower: email.toLowerCase(),
        achievements: {
          createdAt: new Date(),
          elo: 1200
        },
        stats: { wins: 0, losses: 0, draws: 0, elo: 1200 }
      });
      onSignUp(username, email, password); // Notify parent for navigation
    } catch (error: any) {
      console.error('Firebase error:', error);
      let message = 'Failed to sign up.';
      if (error.code === 'auth/email-already-in-use') message = 'Email is already in use.';
      if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
      if (error.code === 'auth/weak-password') message = 'Password is too weak.';
      if (error.code === 'auth/user-not-found') message = 'No user found with this email.';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
      if (error.message) message += ` (${error.message})`;
      setErrors(prev => ({ ...prev, firebase: message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Close button */}
          <div className="absolute top-4 right-4">
            <button className="text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-white/20 rounded-full">
                <Gamepad2 className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white">SK CHESS</h1>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
            <p className="text-white/70">Join the chess community and start playing</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.firebase && (
              <div className="text-red-400 text-center text-sm font-medium mb-2">{errors.firebase}</div>
            )}
            <div className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                      errors.username ? 'border-red-400' : 'border-white/20'
                    } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all`}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-300">{errors.username}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                      errors.email ? 'border-red-400' : 'border-white/20'
                    } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-300">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 bg-white/10 border ${
                      errors.password ? 'border-red-400' : 'border-white/20'
                    } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-white/50 hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/50 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-300">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 bg-white/10 border ${
                      errors.confirmPassword ? 'border-red-400' : 'border-white/20'
                    } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-white/50 hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/50 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-300">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/30 rounded bg-white/10"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-white/70">
                I agree to the{' '}
                <a href="#" className="text-blue-300 hover:text-blue-200 transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-300 hover:text-blue-200 transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading || loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {isLoading || loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-white/70">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignIn}
                  className="font-medium text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 