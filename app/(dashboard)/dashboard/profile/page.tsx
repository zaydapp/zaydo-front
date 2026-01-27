'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { User, Mail, Calendar, Shield, Lock, Eye, EyeOff, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  // Sync form with user data when user changes
  useEffect(() => {
    if (user && !isEditingName) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user, isEditingName]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleEditName = () => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };

  const handleSaveProfile = async () => {
    if (!profileForm.firstName.trim() && !profileForm.lastName.trim()) {
      toast.error(t('profile.nameRequired'));
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updatedUser = await authApi.updateProfile({
        firstName: profileForm.firstName.trim() || undefined,
        lastName: profileForm.lastName.trim() || undefined,
      });
      updateUser(updatedUser);
      toast.success(t('profile.profileUpdateSuccess'));
      setIsEditingName(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('profile.profileUpdateFailed');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      const responseMessage = axiosError?.response?.data?.message;
      toast.error(responseMessage || errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error(t('profile.passwordFieldsRequired'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error(t('profile.passwordMinLength'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('profile.passwordsDoNotMatch'));
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error(t('profile.newPasswordMustBeDifferent'));
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(t('profile.passwordChangeSuccess'));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('profile.passwordChangeFailed');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      const responseMessage = axiosError?.response?.data?.message;
      toast.error(responseMessage || errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
        <p className="text-muted-foreground">{t('profile.subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.personalInfo')}</CardTitle>
            <CardDescription>{t('profile.personalInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar} alt={user?.email} />
                <AvatarFallback className="text-lg">
                  {getInitials(
                    profileForm.firstName || user?.firstName,
                    profileForm.lastName || user?.lastName
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditingName ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="firstName" className="text-xs">
                          {t('profile.firstName')}
                        </Label>
                        <Input
                          id="firstName"
                          value={profileForm.firstName}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, firstName: e.target.value })
                          }
                          placeholder={t('profile.firstNamePlaceholder')}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lastName" className="text-xs">
                          {t('profile.lastName')}
                        </Label>
                        <Input
                          id="lastName"
                          value={profileForm.lastName}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, lastName: e.target.value })
                          }
                          placeholder={t('profile.lastNamePlaceholder')}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={isUpdatingProfile}
                        className="flex-1"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        {t('common.save')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isUpdatingProfile}
                        className="flex-1"
                      >
                        <X className="mr-1 h-3 w-3" />
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {(profileForm.firstName || user?.firstName) &&
                        (profileForm.lastName || user?.lastName)
                          ? `${profileForm.firstName || user?.firstName} ${profileForm.lastName || user?.lastName}`
                          : user?.email?.split('@')[0] || 'User'}
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleEditName}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                    {user?.role && (
                      <Badge variant="secondary" className="mt-2">
                        <Shield className="mr-1 h-3 w-3" />
                        {user.role}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
                  <p className="font-medium">{user?.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('profile.name')}</p>
                  <p className="font-medium">
                    {(profileForm.firstName || user?.firstName) &&
                    (profileForm.lastName || user?.lastName)
                      ? `${profileForm.firstName || user?.firstName} ${profileForm.lastName || user?.lastName}`
                      : user?.email?.split('@')[0] || '-'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.accountInfo')}</CardTitle>
            <CardDescription>{t('profile.accountInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.memberSince')}</p>
                <p className="font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('profile.changePassword')}
          </CardTitle>
          <CardDescription>{t('profile.changePasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder={t('profile.currentPasswordPlaceholder')}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder={t('profile.newPasswordPlaceholder')}
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('profile.passwordMinLengthHint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder={t('profile.confirmPasswordPlaceholder')}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={isChangingPassword} className="w-full">
              {isChangingPassword ? t('common.saving') : t('profile.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
