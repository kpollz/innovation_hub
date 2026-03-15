import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  team: z.string().min(1, 'Team is required'),
  department: z.string().min(1, 'Department is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, error, clearError } = useAuthStore();
  const { showToast } = useUIStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      showToast({ type: 'success', message: 'Registration successful! Please sign in.' });
      navigate('/login');
    } catch {
      showToast({ type: 'error', message: 'Registration failed. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Innovation Hub</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Username"
                type="text"
                {...register('username')}
                error={errors.username?.message}
              />

              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
              />

              <Input
                label="Password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
              />

              <Input
                label="Full Name"
                type="text"
                {...register('full_name')}
                error={errors.full_name?.message}
              />

              <Input
                label="Team"
                type="text"
                {...register('team')}
                error={errors.team?.message}
              />

              <Input
                label="Department"
                type="text"
                {...register('department')}
                error={errors.department?.message}
              />

              {error && (
                <div className="text-sm text-danger-600 text-center">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
              >
                Create account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
