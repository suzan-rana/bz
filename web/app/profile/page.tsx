'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userAPI } from '@/lib/api';
import { User, Mail, Phone, MapPin, Save, Edit, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    is_seller: boolean;
    profile_picture?: string;
    created_at: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            const userData = response.data;
            setProfile(userData);
            setFormData({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                phone: userData.phone || '',
                address: userData.address || '',
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await userAPI.updateProfile(formData);
            toast.success('Profile updated successfully!');
            setIsEditing(false);
            fetchProfile(); // Refresh the profile data
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="text-center py-12">
                    <CardContent>
                        <h3 className="text-lg font-medium">Profile not found</h3>
                        <p className="text-muted-foreground">Unable to load your profile information.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Profile</h1>
                    <p className="text-muted-foreground">Manage your account information</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Overview */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Account Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                                        {profile.profile_picture ? (
                                            <img
                                                src={profile.profile_picture}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-12 w-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold">
                                        {profile.first_name} {profile.last_name}
                                    </h3>
                                    <p className="text-muted-foreground">{profile.email}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{profile.email}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{profile.is_seller ? 'Seller Account' : 'Buyer Account'}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Profile Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>
                                            Update your personal details and contact information
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(!isEditing)}
                                        disabled={saving}
                                    >
                                        {isEditing ? (
                                            <>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Cancel
                                            </>
                                        ) : (
                                            <>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name">First Name</Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                placeholder="Enter your first name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="last_name">Last Name</Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                placeholder="Enter your last name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                placeholder="Enter your phone number"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                placeholder="Enter your address"
                                            />
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="flex gap-4">
                                            <Button type="submit" disabled={saving}>
                                                {saving ? (
                                                    'Saving...'
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>

                        {/* Account Actions */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Account Actions</CardTitle>
                                <CardDescription>
                                    Manage your account settings and preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Account Type</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {profile.is_seller ? 'Seller Account' : 'Buyer Account'}
                                        </p>
                                    </div>
                                    <Button variant="outline" disabled>
                                        {profile.is_seller ? 'Seller' : 'Buyer'}
                                    </Button>
                                </div>

                                {profile.is_seller && (
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium">KYC Verification</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Complete your seller verification
                                            </p>
                                        </div>
                                        <Button asChild variant="outline">
                                            <Link href="/kyc">Manage KYC</Link>
                                        </Button>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Password</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Update your account password
                                        </p>
                                    </div>
                                    <Button variant="outline" disabled>
                                        Change Password
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
