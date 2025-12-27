'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { kycAPI } from '@/lib/api';
import { Upload, FileText, Building, User, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface KYCData {
    id: string;
    business_name: string;
    business_address: string;
    business_phone: string;
    business_email: string;
    tax_id: string;
    bank_account_number: string;
    bank_name: string;
    status: string;
}

export default function KYCPage() {
    const [formData, setFormData] = useState({
        business_name: '',
        business_address: '',
        business_phone: '',
        business_email: '',
        tax_id: '',
        bank_account_number: '',
        bank_name: '',
    });
    const [files, setFiles] = useState({
        business_license: null as File | null,
        id_document: null as File | null,
        proof_of_address: null as File | null,
    });
    const [existingKYC, setExistingKYC] = useState<KYCData | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkExistingKYC();
    }, []);

    const checkExistingKYC = async () => {
        try {
            const response = await kycAPI.getMyKYC();
            setExistingKYC(response.data);
            if (response.data) {
                setFormData({
                    business_name: response.data.business_name || '',
                    business_address: response.data.business_address || '',
                    business_phone: response.data.business_phone || '',
                    business_email: response.data.business_email || '',
                    tax_id: response.data.tax_id || '',
                    bank_account_number: response.data.bank_account_number || '',
                    bank_name: response.data.bank_name || '',
                });
            }
        } catch (error) {
            // No existing KYC found
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
        const file = e.target.files?.[0];
        if (file) {
            setFiles({
                ...files,
                [field]: file,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();

            // Add form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (value) {
                    formDataToSend.append(key, value);
                }
            });

            // Add files
            Object.entries(files).forEach(([key, file]) => {
                if (file) {
                    formDataToSend.append(key, file);
                }
            });

            if (existingKYC) {
                await kycAPI.updateKYC(existingKYC.id, formDataToSend);
                toast.success('KYC updated successfully!');
            } else {
                await kycAPI.createKYC(formDataToSend);
                toast.success('KYC submitted successfully!');
            }

            router.push('/seller-dashboard');
        } catch (error: any) {
            console.error('KYC submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit KYC');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Seller Verification</h1>
                    <p className="text-muted-foreground">
                        Complete your KYC verification to start selling books on our platform.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Business Information
                        </CardTitle>
                        <CardDescription>
                            {existingKYC ? 'Update your business information' : 'Provide your business details for verification'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Business Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="business_name">Business Name *</Label>
                                    <Input
                                        id="business_name"
                                        name="business_name"
                                        value={formData.business_name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter your business name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="business_phone">Business Phone *</Label>
                                    <Input
                                        id="business_phone"
                                        name="business_phone"
                                        type="tel"
                                        value={formData.business_phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter business phone number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="business_email">Business Email *</Label>
                                    <Input
                                        id="business_email"
                                        name="business_email"
                                        type="email"
                                        value={formData.business_email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter business email"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tax_id">Tax ID (Optional)</Label>
                                    <Input
                                        id="tax_id"
                                        name="tax_id"
                                        value={formData.tax_id}
                                        onChange={handleInputChange}
                                        placeholder="Enter tax identification number"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="business_address">Business Address *</Label>
                                <Input
                                    id="business_address"
                                    name="business_address"
                                    value={formData.business_address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter complete business address"
                                />
                            </div>

                            {/* Banking Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">Bank Name (Optional)</Label>
                                    <Input
                                        id="bank_name"
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleInputChange}
                                        placeholder="Enter bank name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bank_account_number">Bank Account Number (Optional)</Label>
                                    <Input
                                        id="bank_account_number"
                                        name="bank_account_number"
                                        value={formData.bank_account_number}
                                        onChange={handleInputChange}
                                        placeholder="Enter bank account number"
                                    />
                                </div>
                            </div>

                            {/* Document Upload */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Required Documents
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="id_document">ID Document *</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                            <input
                                                id="id_document"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'id_document')}
                                                required={!existingKYC}
                                                className="hidden"
                                            />
                                            <label htmlFor="id_document" className="cursor-pointer text-sm text-gray-600">
                                                {files.id_document ? files.id_document.name : 'Upload ID document'}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="proof_of_address">Proof of Address *</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                            <input
                                                id="proof_of_address"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'proof_of_address')}
                                                required={!existingKYC}
                                                className="hidden"
                                            />
                                            <label htmlFor="proof_of_address" className="cursor-pointer text-sm text-gray-600">
                                                {files.proof_of_address ? files.proof_of_address.name : 'Upload address proof'}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_license">Business License (Optional)</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                            <input
                                                id="business_license"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'business_license')}
                                                className="hidden"
                                            />
                                            <label htmlFor="business_license" className="cursor-pointer text-sm text-gray-600">
                                                {files.business_license ? files.business_license.name : 'Upload business license'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? 'Submitting...' : (existingKYC ? 'Update KYC' : 'Submit KYC')}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
