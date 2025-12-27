'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Settings,
    User,
    Shield,
    CreditCard,
    Bell,
    Edit,
    Save,
    X,
    CheckCircle,
    AlertTriangle,
    Camera,
    Mail,
    Phone,
    MapPin,
    Building
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SellerProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    company_name: string;
    business_type: string;
    kyc_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
    kyc_documents: {
        id_card: string;
        business_license: string;
        bank_statement: string;
    };
    payment_settings: {
        bank_name: string;
        account_number: string;
        account_holder: string;
    };
    notification_preferences: {
        email_notifications: boolean;
        order_notifications: boolean;
        payment_notifications: boolean;
        marketing_emails: boolean;
    };
}

export default function SellerSettings() {
    const [profile, setProfile] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<'profile' | 'kyc' | 'payment' | 'notifications' | null>(null);
    const [formData, setFormData] = useState<Partial<SellerProfile>>({});
    const { user } = useAuth();

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // TODO: Implement API call to fetch seller profile
            // const response = await profileAPI.getSellerProfile();
            // setProfile(response.data);

            // Mock data for now
            setProfile({
                id: '1',
                first_name: user?.first_name || '',
                last_name: user?.last_name || '',
                email: user?.email || '',
                phone: '',
                address: '',
                company_name: '',
                business_type: '',
                kyc_status: 'not_submitted',
                kyc_documents: {
                    id_card: '',
                    business_license: '',
                    bank_statement: ''
                },
                payment_settings: {
                    bank_name: '',
                    account_number: '',
                    account_holder: ''
                },
                notification_preferences: {
                    email_notifications: true,
                    order_notifications: true,
                    payment_notifications: true,
                    marketing_emails: false
                }
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.is_seller) {
            fetchProfile();
        }
    }, [user]);

    const handleEdit = (section: string) => {
        setEditing(section as any);
        setFormData(profile || {});
    };

    const handleCancel = () => {
        setEditing(null);
        setFormData({});
    };

    const handleSave = async (section: string) => {
        try {
            // TODO: Implement API call to update profile
            // await profileAPI.updateSellerProfile(formData);
            console.log('Saving:', section, formData);

            // Update local state
            if (profile) {
                setProfile({ ...profile, ...formData });
            }
            setEditing(null);
            setFormData({});
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile');
        }
    };

    const getKYCStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getKYCStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle className="h-4 w-4" />;
            case 'pending': return <AlertTriangle className="h-4 w-4" />;
            case 'rejected': return <X className="h-4 w-4" />;
            default: return <AlertTriangle className="h-4 w-4" />;
        }
    };

    if (!user?.is_seller) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        This page is only available for seller accounts.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <Settings className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading settings...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Profile not found.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your seller account settings</p>
            </div>

            <div className="space-y-8">
                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>
                            Update your seller profile and contact information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {editing === 'profile' ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input
                                            id="first_name"
                                            value={formData.first_name || ''}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            value={formData.last_name || ''}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="company_name">Company Name</Label>
                                        <Input
                                            id="company_name"
                                            value={formData.company_name || ''}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="business_type">Business Type</Label>
                                        <Input
                                            id="business_type"
                                            value={formData.business_type || ''}
                                            onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave('profile')}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">First Name</Label>
                                        <p className="text-gray-900">{profile.first_name || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Last Name</Label>
                                        <p className="text-gray-900">{profile.last_name || 'Not set'}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                                    <p className="text-gray-900">{profile.email}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                                    <p className="text-gray-900">{profile.phone || 'Not set'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                                    <p className="text-gray-900">{profile.address || 'Not set'}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Company Name</Label>
                                        <p className="text-gray-900">{profile.company_name || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Business Type</Label>
                                        <p className="text-gray-900">{profile.business_type || 'Not set'}</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => handleEdit('profile')}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* KYC Verification */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            KYC Verification
                        </CardTitle>
                        <CardDescription>
                            Complete your Know Your Customer verification to start selling
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">Verification Status</h4>
                                    <p className="text-sm text-gray-600">
                                        {profile.kyc_status === 'approved' && 'Your account has been verified successfully.'}
                                        {profile.kyc_status === 'pending' && 'Your verification is under review.'}
                                        {profile.kyc_status === 'rejected' && 'Your verification was rejected. Please resubmit.'}
                                        {profile.kyc_status === 'not_submitted' && 'Please complete your KYC verification to start selling.'}
                                    </p>
                                </div>
                                <Badge className={`${getKYCStatusColor(profile.kyc_status)}`}>
                                    {getKYCStatusIcon(profile.kyc_status)}
                                    <span className="ml-1 capitalize">{profile.kyc_status.replace('_', ' ')}</span>
                                </Badge>
                            </div>

                            {profile.kyc_status !== 'approved' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 border rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Camera className="h-4 w-4" />
                                                <Label className="text-sm font-medium">ID Card</Label>
                                            </div>
                                            <Input
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="p-4 border rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Building className="h-4 w-4" />
                                                <Label className="text-sm font-medium">Business License</Label>
                                            </div>
                                            <Input
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="p-4 border rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CreditCard className="h-4 w-4" />
                                                <Label className="text-sm font-medium">Bank Statement</Label>
                                            </div>
                                            <Input
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                    <Button>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Submit for Verification
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment Settings
                        </CardTitle>
                        <CardDescription>
                            Configure your bank account for receiving payments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {editing === 'payment' ? (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="bank_name">Bank Name</Label>
                                    <Input
                                        id="bank_name"
                                        value={formData.payment_settings?.bank_name || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            payment_settings: { ...formData.payment_settings, bank_name: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="account_holder">Account Holder Name</Label>
                                    <Input
                                        id="account_holder"
                                        value={formData.payment_settings?.account_holder || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            payment_settings: { ...formData.payment_settings, account_holder: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="account_number">Account Number</Label>
                                    <Input
                                        id="account_number"
                                        value={formData.payment_settings?.account_number || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            payment_settings: { ...formData.payment_settings, account_number: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave('payment')}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Bank Name</Label>
                                    <p className="text-gray-900">{profile.payment_settings.bank_name || 'Not set'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Account Holder</Label>
                                    <p className="text-gray-900">{profile.payment_settings.account_holder || 'Not set'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                                    <p className="text-gray-900">
                                        {profile.payment_settings.account_number
                                            ? `****${profile.payment_settings.account_number.slice(-4)}`
                                            : 'Not set'
                                        }
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => handleEdit('payment')}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Payment Settings
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notification Preferences
                        </CardTitle>
                        <CardDescription>
                            Manage your email notification settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {editing === 'notifications' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">Email Notifications</Label>
                                        <p className="text-xs text-gray-600">Receive notifications via email</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.notification_preferences?.email_notifications || false}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            notification_preferences: {
                                                ...formData.notification_preferences,
                                                email_notifications: e.target.checked
                                            }
                                        })}
                                        className="rounded"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">Order Notifications</Label>
                                        <p className="text-xs text-gray-600">Get notified about new orders</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.notification_preferences?.order_notifications || false}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            notification_preferences: {
                                                ...formData.notification_preferences,
                                                order_notifications: e.target.checked
                                            }
                                        })}
                                        className="rounded"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">Payment Notifications</Label>
                                        <p className="text-xs text-gray-600">Get notified about payments</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.notification_preferences?.payment_notifications || false}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            notification_preferences: {
                                                ...formData.notification_preferences,
                                                payment_notifications: e.target.checked
                                            }
                                        })}
                                        className="rounded"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">Marketing Emails</Label>
                                        <p className="text-xs text-gray-600">Receive promotional emails</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.notification_preferences?.marketing_emails || false}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            notification_preferences: {
                                                ...formData.notification_preferences,
                                                marketing_emails: e.target.checked
                                            }
                                        })}
                                        className="rounded"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave('notifications')}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Email Notifications</Label>
                                        <p className="text-xs text-gray-600">Receive notifications via email</p>
                                    </div>
                                    <Badge variant={profile.notification_preferences.email_notifications ? 'default' : 'secondary'}>
                                        {profile.notification_preferences.email_notifications ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Order Notifications</Label>
                                        <p className="text-xs text-gray-600">Get notified about new orders</p>
                                    </div>
                                    <Badge variant={profile.notification_preferences.order_notifications ? 'default' : 'secondary'}>
                                        {profile.notification_preferences.order_notifications ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Payment Notifications</Label>
                                        <p className="text-xs text-gray-600">Get notified about payments</p>
                                    </div>
                                    <Badge variant={profile.notification_preferences.payment_notifications ? 'default' : 'secondary'}>
                                        {profile.notification_preferences.payment_notifications ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Marketing Emails</Label>
                                        <p className="text-xs text-gray-600">Receive promotional emails</p>
                                    </div>
                                    <Badge variant={profile.notification_preferences.marketing_emails ? 'default' : 'secondary'}>
                                        {profile.notification_preferences.marketing_emails ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                                <Button variant="outline" onClick={() => handleEdit('notifications')}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Notifications
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
