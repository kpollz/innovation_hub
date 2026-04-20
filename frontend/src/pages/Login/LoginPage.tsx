import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated, error, clearError } = useAuthStore();
  const { showToast } = useUIStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      showToast({ type: 'success', message: t('auth.login_success') });
      navigate('/');
    } catch {
      showToast({ type: 'error', message: t('auth.login_error') });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-card-heading font-bold text-foreground">Innovation Hub</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('auth.sign_in_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label={t('auth.username')}
                type="text"
                {...register('username')}
                error={errors.username?.message}
              />

              <Input
                label={t('auth.password')}
                type="password"
                {...register('password')}
                error={errors.password?.message}
              />

              {error && (
                <div className="text-sm text-danger-600 text-center">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
              >
                {t('auth.sign_in')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.no_account')}{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t('auth.create_one')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
