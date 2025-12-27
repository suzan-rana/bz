'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { wishlistAPI } from '@/lib/api';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    condition: string;
    cover_image?: string;
    seller: {
      email: string;
    };
    category: {
      name: string;
    };
  };
  added_at: string;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistAPI.getAll();
      setWishlistItems(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (itemId: string, bookTitle: string) => {
    try {
      await wishlistAPI.delete(itemId);
      toast.success(`Removed "${bookTitle}" from wishlist`);
      fetchWishlist(); // Refresh the list
    } catch (error) {
      toast.error('Failed to remove from wishlist');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
          <p className="text-muted-foreground">Your saved books for later purchase</p>
        </div>

        {/* Wishlist Items */}
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[3/4] relative overflow-hidden">
                  {item.book.cover_image ? (
                    <img
                      src={item.book.cover_image}
                      alt={item.book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveFromWishlist(item.id, item.book.title)}
                      className="bg-background/80 hover:bg-background text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{item.book.title}</h3>
                    <p className="text-muted-foreground text-sm">by {item.book.author}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">Rs {item.book.price}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.book.condition)}`}>
                        {formatCondition(item.book.condition)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{item.book.category.name}</span>
                      <span>{item.book.seller.email}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/books/${item.book.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2">
                      Added {new Date(item.added_at).toLocaleDateString()}
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
                <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">Your wishlist is empty</h3>
                <p className="text-muted-foreground">
                  Start browsing books and add them to your wishlist for later
                </p>
                <Button asChild>
                  <Link href="/books">Browse Books</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
