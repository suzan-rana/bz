'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Package,
  DollarSign
} from 'lucide-react';
import { booksAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getFallbackImage, getImageUrl } from '@/lib/utils';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  quantity: number;
  category: {
    name: string;
  };
  cover_image?: string;
  images?: Array<{
    id: string;
    image: string;
    caption?: string;
  }>;
  is_active: boolean;
  created_at: string;
}

export default function SellerBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { user } = useAuth();
  const router = useRouter();

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getMyBooks();
      setBooks(response.data);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_seller) {
      fetchBooks();
    }
  }, [user]);

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
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading books...</span>
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

  const filteredBooks = books.filter(book => {
    if (filter === 'active') return book.is_active;
    if (filter === 'inactive') return !book.is_active;
    return true;
  });

  const stats = {
    total: books.length,
    active: books.filter(b => b.is_active).length,
    inactive: books.filter(b => !b.is_active).length,
    lowStock: books.filter(b => b.quantity < 5).length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Books</h1>
          <p className="text-gray-600 mt-2">Manage your book inventory and listings</p>
        </div>
        <Link href="/sell">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Books</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({stats.total})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active ({stats.active})
              </Button>
              <Button
                variant={filter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('inactive')}
              >
                Inactive ({stats.inactive})
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchBooks}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No books yet' : `No ${filter} books`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? 'Get started by adding your first book to the marketplace.'
                  : `You don't have any ${filter} books at the moment.`
                }
              </p>
              {filter === 'all' && (
                <Link href="/sell">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Book
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                    <Badge variant="outline" className="mb-2">
                      {book.category.name}
                    </Badge>
                  </div>
                  <Badge variant={book.is_active ? 'default' : 'secondary'}>
                    {book.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Image Gallery */}
                <div className="mb-4 relative">
                  <div className="w-full h-32 relative overflow-hidden rounded-lg">
                    {(book.cover_image || (book.images && book.images.length > 0)) ? (
                      <>
                        {/* Main Image */}
                        <img
                          src={getImageUrl(book.cover_image || (book.images && book.images[0]?.image))}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />

                        {/* Image Counter Badge */}
                        {(book.cover_image && book.images && book.images.length > 0) && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            +{book.images.length} more
                          </div>
                        )}

                        {/* Image Gallery Preview */}
                        {(book.cover_image && book.images && book.images.length > 0) && (
                          <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                            {book.images.slice(0, 2).map((img, index) => (
                              <div key={img.id} className="w-6 h-6 rounded overflow-hidden border border-white">
                                <img
                                  src={getImageUrl(img.image)}
                                  alt={`${book.title} ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {book.images && book.images.length > 2 && (
                              <div className="w-6 h-6 rounded bg-black/70 text-white text-xs flex items-center justify-center border border-white">
                                +{book.images.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center relative">
                        <img
                          src={getFallbackImage(book.title, book.author, 'wallpaper')}
                          alt={`Cover for ${book.title}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-semibold text-green-600">
                      Rs {book.price ? Number(book.price).toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className={`font-semibold ${book.quantity < 5 ? 'text-red-600' :
                      book.quantity < 10 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                      {book.quantity} units
                    </span>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/books/${book.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/books/${book.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        // TODO: Implement delete functionality
                        console.log('Delete book:', book.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
