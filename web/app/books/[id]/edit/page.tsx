'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { booksAPI, categoriesAPI } from '@/lib/api';
import { useProgress } from '@/hooks/useProgress';
import { Upload, X, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  quantity: number;
  cover_image?: string;
  images: Array<{
    id: string;
    image: string;
    caption?: string;
  }>;
}

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const { withProgress } = useProgress();
  const bookId = params.id as string;

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: string, image: string, caption?: string }>>([]);

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
      fetchCategories();
    }
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      const response = await booksAPI.getById(bookId);
      const bookData = response.data;
      setBook(bookData);
      setExistingImages(bookData.images || []);

      setFormData({
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn || '',
        description: bookData.description,
        price: bookData.price.toString(),
        condition: bookData.condition,
        category: bookData.category,
        quantity: bookData.quantity.toString(),
      });
    } catch (error) {
      console.error('Error fetching book details:', error);
      toast.error('Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
    const currentTotal = existingImages.length + additionalImages.length;
    const maxAllowed = 5;

    if (currentTotal + files.length > maxAllowed) {
      toast.error(`Maximum ${maxAllowed} images allowed. You can add ${maxAllowed - currentTotal} more images.`);
      return;
    }

    setAdditionalImages(prev => [...prev, ...files]);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate image count
    const totalImages = existingImages.length + additionalImages.length;
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed. Please remove some images before saving.');
      return;
    }

    setSaving(true);

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

      // Add existing images to keep
      existingImages.forEach(img => {
        formDataToSend.append('keep_images', img.id);
      });

      await booksAPI.update(bookId, formDataToSend);
      toast.success('Book updated successfully!');
      router.push('/my-books');
    } catch (error: any) {
      console.error('Book update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update book');
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

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium">Book not found</h3>
            <p className="text-muted-foreground">The book you're trying to edit doesn't exist.</p>
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Book</h1>
              <p className="text-muted-foreground">Update your book listing information</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Book Information</CardTitle>
            <CardDescription>
              Update the details of your book listing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
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

              {/* Images Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Images</h3>

                {/* Current Cover Image Display */}
                {book.cover_image && !coverImage && (
                  <div className="space-y-2">
                    <Label>Current Cover Image</Label>
                    <div className="relative inline-block">
                      <img
                        src={book.cover_image}
                        alt="Current cover"
                        className="w-32 h-40 object-cover rounded-lg border"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Current Cover
                      </div>
                    </div>
                  </div>
                )}

                {/* New Cover Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="cover_image">
                    {book.cover_image ? 'Replace Cover Image' : 'Cover Image'}
                  </Label>
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
                      {coverImage ? coverImage.name : (book.cover_image ? 'Upload new cover image' : 'Upload cover image (optional)')}
                    </label>
                  </div>

                  {/* Preview of new cover image */}
                  {coverImage && (
                    <div className="mt-2">
                      <Label>New Cover Preview</Label>
                      <div className="relative inline-block">
                        <img
                          src={URL.createObjectURL(coverImage)}
                          alt="New cover preview"
                          className="w-32 h-40 object-cover rounded-lg border"
                        />
                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          New Cover
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Existing Additional Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Additional Images ({existingImages.length})</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.image}
                            alt="Book image"
                            className="w-full h-24 object-cover rounded border"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0"
                              onClick={() => removeExistingImage(img.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {img.caption && (
                            <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded truncate">
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click the X button to remove images. Removed images will be deleted permanently.
                    </p>
                  </div>
                )}

                {/* New Additional Images Upload */}
                <div className="space-y-2">
                  <Label htmlFor="additional_images">
                    Add More Images ({(existingImages.length + additionalImages.length)}/5 total)
                  </Label>
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
                      disabled={existingImages.length + additionalImages.length >= 5}
                    />
                    <label
                      htmlFor="additional_images"
                      className={`cursor-pointer text-sm ${existingImages.length + additionalImages.length >= 5 ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {existingImages.length + additionalImages.length >= 5
                        ? 'Maximum 5 images reached'
                        : 'Upload additional images'
                      }
                    </label>
                  </div>

                  {/* Preview of new additional images */}
                  {additionalImages.length > 0 && (
                    <div className="mt-4">
                      <Label>New Images Preview ({additionalImages.length})</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {additionalImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New image ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={() => removeAdditionalImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded">
                              New
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Image Summary</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Cover image: {book.cover_image ? 'Present' : 'None'} {coverImage && '(Will be replaced)'}</div>
                    <div>• Additional images: {existingImages.length} current + {additionalImages.length} new = {existingImages.length + additionalImages.length} total</div>
                    <div>• Maximum allowed: 5 images total</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Updating...' : 'Update Book'}
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
