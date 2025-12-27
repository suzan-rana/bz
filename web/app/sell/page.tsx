'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { booksAPI, categoriesAPI, kycAPI } from '@/lib/api';
import { Upload, BookOpen, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
}

export default function SellPage() {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        description: '',
        price: '',
        condition: 'good',
        category: '',
        quantity: '1',
    });
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [additionalImages, setAdditionalImages] = useState<File[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [kycStatus, setKycStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkKYCAndLoadCategories();
    }, []);

    const checkKYCAndLoadCategories = async () => {
        try {
            const [kycResponse, categoriesResponse] = await Promise.all([
                kycAPI.getMyKYC().catch(() => ({ data: null })),
                categoriesAPI.getAll()
            ]);

            setKycStatus(kycResponse.data?.status || null);
            setCategories(categoriesResponse.data.results || categoriesResponse.data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
        }
    };

    const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAdditionalImages(prev => [...prev, ...files]);
    };

    const removeAdditionalImage = (index: number) => {
        setAdditionalImages(prev => prev.filter((_, i) => i !== index));
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

            // Add cover image
            if (coverImage) {
                formDataToSend.append('cover_image', coverImage);
            }

            // Add additional images
            additionalImages.forEach((file, index) => {
                formDataToSend.append(`additional_images`, file);
            });

            await booksAPI.create(formDataToSend);
            toast.success('Book added successfully!');
            router.push('/my-books');
        } catch (error: any) {
            console.error('Book creation error:', error);
            toast.error(error.response?.data?.message || 'Failed to add book');
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

    // Check KYC status
    if (!kycStatus) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-2xl mx-auto">
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                <div className="flex-1">
                                    <h3 className="font-medium text-yellow-800">KYC Verification Required</h3>
                                    <p className="text-sm text-yellow-700">
                                        You need to complete your KYC verification before you can sell books on our platform.
                                    </p>
                                </div>
                                <Button asChild>
                                    <Link href="/kyc">Complete KYC</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (kycStatus === 'pending') {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-2xl mx-auto">
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                <div className="flex-1">
                                    <h3 className="font-medium text-yellow-800">KYC Under Review</h3>
                                    <p className="text-sm text-yellow-700">
                                        Your KYC application is being reviewed. You'll be able to sell books once it's approved.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (kycStatus === 'rejected') {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-2xl mx-auto">
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <div className="flex-1">
                                    <h3 className="font-medium text-red-800">KYC Rejected</h3>
                                    <p className="text-sm text-red-700">
                                        Your KYC application was rejected. Please update your information and resubmit.
                                    </p>
                                </div>
                                <Button asChild>
                                    <Link href="/kyc">Update KYC</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Sell Your Book</h1>
                    <p className="text-muted-foreground">
                        Add a new book to your inventory and start selling.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Book Information
                        </CardTitle>
                        <CardDescription>
                            Provide detailed information about the book you want to sell
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Book Title *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter book title"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="author">Author *</Label>
                                    <Input
                                        id="author"
                                        name="author"
                                        value={formData.author}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter author name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="isbn">ISBN (Optional)</Label>
                                    <Input
                                        id="isbn"
                                        name="isbn"
                                        value={formData.isbn}
                                        onChange={handleInputChange}
                                        placeholder="Enter ISBN number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Price *</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter price"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity *</Label>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter quantity"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="condition">Condition *</Label>
                                    <select
                                        id="condition"
                                        name="condition"
                                        value={formData.condition}
                                        onChange={handleInputChange}
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="new">New</option>
                                        <option value="like_new">Like New</option>
                                        <option value="very_good">Very Good</option>
                                        <option value="good">Good</option>
                                        <option value="acceptable">Acceptable</option>
                                        <option value="poor">Poor</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows={4}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Describe the book's condition, any notes, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cover_image">Cover Image (Optional)</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <input
                                        id="cover_image"
                                        name="cover_image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverImageChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="cover_image" className="cursor-pointer text-sm text-gray-600">
                                        {coverImage ? coverImage.name : 'Upload cover image'}
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="additional_images">Additional Images (Optional, up to 3 total)</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <input
                                        id="additional_images"
                                        name="additional_images"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleAdditionalImagesChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="additional_images" className="cursor-pointer text-sm text-gray-600">
                                        Upload additional images
                                    </label>
                                </div>

                                {additionalImages.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        {additionalImages.map((file, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Additional image ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                                    onClick={() => removeAdditionalImage(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? 'Adding Book...' : 'Add Book'}
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
