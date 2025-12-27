'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { booksAPI } from '@/lib/api';
import { getFallbackImage, getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { Edit, Trash2, Eye, Plus, Package, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: string;
  quantity: number;
  cover_image?: string;
  images?: Array<{
    id: string;
    image: string;
    caption?: string;
  }>;
  is_active: boolean;
  category: {
    name: string;
  };
  created_at: string;
}

export default function MyBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const fetchMyBooks = async () => {
    try {
      const response = await booksAPI.getMyBooks();
      setBooks(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching my books:', error);
      toast.error('Failed to load your books');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (bookId: string, currentStatus: boolean) => {
    try {
      await booksAPI.update(bookId, { is_active: !currentStatus });
      toast.success(`Book ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchMyBooks(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update book status');
    }
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      try {
        await booksAPI.delete(bookId);
        toast.success('Book deleted successfully!');
        fetchMyBooks(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete book');
      }
    }
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      new: 'bg-green-100 text-green-800',
      like_new: 'bg-blue-100 text-blue-800',
      very_good: 'bg-purple-100 text-purple-800',
      good: 'bg-yellow-100 text-yellow-800',
      acceptable: 'bg-orange-100 text-orange-800',
      poor: 'bg-red-100 text-red-800',
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCondition = (condition: string) => {
    return condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStats = () => {
    const totalBooks = books.length;
    const activeBooks = books.filter(book => book.is_active).length;
    const totalValue = books.reduce((sum, book) => sum + (book.price * book.quantity), 0);
    const totalStock = books.reduce((sum, book) => sum + book.quantity, 0);

    return { totalBooks, activeBooks, totalValue, totalStock };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Books</h1>
              <p className="text-muted-foreground">Manage your book listings and inventory</p>
            </div>
            <Button asChild>
              <Link href="/sell">
                <Plus className="h-4 w-4 mr-2" />
                Add New Book
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">
                All time listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Books</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBooks}</div>
              <p className="text-xs text-muted-foreground">
                Currently listed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStock}</div>
              <p className="text-xs text-muted-foreground">
                Books in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {stats.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Inventory value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Books List */}
        {books.length > 0 ? (
          <div className="space-y-4">
            {books.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Book Cover with Image Gallery */}
                    <div className="w-20 h-24 flex-shrink-0 overflow-hidden rounded relative">
                      {(book.cover_image || (book?.images && book.images?.length > 0)) ? (
                        <div className="w-full h-full relative">
                          {/* Main Image */}
                          <img
                            src={getImageUrl(book.cover_image || book.images?.[0]?.image)}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />

                          {/* Image Counter Badge */}
                          {(book.cover_image && book?.images && book.images?.length > 0) && (
                            <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                              +{book.images.length}
                            </div>
                          )}

                          {/* Mini Thumbnails */}
                          {(book.cover_image && book?.images && book.images?.length > 0) && (
                            <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
                              {book.images.slice(0, 2).map((img, index) => (
                                <div key={img.id} className="w-3 h-3 rounded overflow-hidden border border-white">
                                  <img
                                    src={getImageUrl(img.image)}
                                    alt={`${book.title} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {book.images.length > 2 && (
                                <div className="w-3 h-3 rounded bg-black/70 text-white text-[8px] flex items-center justify-center border border-white">
                                  +{book.images.length - 2}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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

                    {/* Book Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{book.title}</h3>
                          <p className="text-muted-foreground text-sm">by {book.author}</p>

                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="font-bold text-primary">Rs {book.price}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(book.condition)}`}>
                              {formatCondition(book.condition)}
                            </span>
                            <span className="text-muted-foreground">Qty: {book.quantity}</span>
                            <span className="text-muted-foreground">{book.category.name}</span>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${book.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {book.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Listed {new Date(book.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/books/${book.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          <Button asChild size="sm" variant="outline">
                            <Link href={`/books/${book.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>

                          <Button
                            size="sm"
                            variant={book.is_active ? "outline" : "default"}
                            onClick={() => handleToggleActive(book.id, book.is_active)}
                          >
                            {book.is_active ? 'Deactivate' : 'Activate'}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBook(book.id, book.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">No books yet</h3>
                <p className="text-muted-foreground">
                  Start selling by adding your first book to the marketplace
                </p>
                <Button asChild>
                  <Link href="/sell">Add Your First Book</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
