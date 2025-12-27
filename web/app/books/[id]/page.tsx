'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { booksAPI, reviewsAPI, ordersAPI, messagesAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, User, Calendar, Shield, Truck, Clock, MessageCircle } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  description: string;
  price: number;
  condition: string;
  quantity: number;
  cover_image?: string;
  seller: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  category: {
    id: string;
    name: string;
  };
  images: Array<{
    id: string;
    image: string;
    caption?: string;
  }>;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const { addItem } = useCart();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [existingReview, setExistingReview] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
      fetchReviews();
      fetchRecommendations();
      if (user) {
        checkCanReview();
      }
    }
  }, [bookId, user]);

  const fetchBookDetails = async () => {
    try {
      const response = await booksAPI.getById(bookId);
      setBook(response.data);
    } catch (error) {
      console.error('Error fetching book details:', error);
      toast.error('Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getAll({ book_id: bookId });
      setReviews(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Don't show error toast for reviews - they're not critical
      setReviews([]);
    }
  };

  const fetchRecommendations = async () => {
    try {
      // Get recommendations based on category and author
      const params: any = {};
      if (book?.category?.id) params.category = book.category.id;
      if (book?.author) params.search = book.author;

      const response = await booksAPI.getAll({
        ...params,
        exclude: bookId,
        limit: 4
      });
      setRecommendations(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Don't show error toast for recommendations - they're not critical
      setRecommendations([]);
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await reviewsAPI.canReview(bookId);
      setCanReview(response.data.can_review);
      setReviewReason(response.data.reason || '');
      if (response.data.existing_review) {
        setExistingReview(response.data.existing_review);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
      setReviewReason('Unable to check review eligibility');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewsAPI.create({
        book: bookId,
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);

      // Refresh reviews and check review eligibility
      await fetchReviews();
      await checkCanReview();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await booksAPI.addToWishlist(bookId);
      setIsInWishlist(true);
      toast.success('Added to wishlist!');
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  const handleRemoveFromWishlist = async () => {
    try {
      await booksAPI.removeFromWishlist(bookId);
      setIsInWishlist(false);
      toast.success('Removed from wishlist!');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };



  const handleAddToCart = () => {
    if (!book) return;

    addItem({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      cover_image: book.cover_image,
    });
    toast.success('Added to cart!');
  };

  const handleMessageSeller = async () => {
    if (!book || !user) return;

    try {
      console.log('Starting conversation with:', {
        book_id: book.id,
        seller_id: book.seller.id,
        message: `Hi! I'm interested in your book "${book.title}". Can you tell me more about it?`
      });

      const response = await messagesAPI.startConversation({
        book_id: book.id,
        seller_id: book.seller.id, // Still needed for the API
        message: `Hi! I'm interested in your book "${book.title}". Can you tell me more about it?`
      });

      console.log('Conversation started successfully:', response.data);

      // Redirect to the conversation
      router.push(`/messages/${response.data.id}`);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to start conversation');
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

  const nextImage = () => {
    if (book && book.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % book.images.length);
    }
  };

  const prevImage = () => {
    if (book && book.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + book.images.length) % book.images.length);
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
            <p className="text-muted-foreground">The book you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allImages = book.cover_image ? [book.cover_image, ...book.images.map(img => img.image)] : book.images.map(img => img.image);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-6">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                {allImages.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(allImages[currentImageIndex])}
                      alt={`${book.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {allImages.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-background/80 px-2 py-1 rounded text-sm">
                            {currentImageIndex + 1} / {allImages.length}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No Images Available</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${index === currentImageIndex ? 'border-primary' : 'border-transparent'
                        }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Book Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{book.title}</CardTitle>
                    <CardDescription className="text-lg">by {book.author}</CardDescription>
                  </div>
                  {user && !user.is_seller && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={isInWishlist ? handleRemoveFromWishlist : handleAddToWishlist}
                      className={isInWishlist ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary">Rs {book.price}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(book.condition)}`}>
                    {formatCondition(book.condition)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Category:</span>
                    <p className="text-muted-foreground">{book.category.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">ISBN:</span>
                    <p className="text-muted-foreground">{book.isbn || 'Not available'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Seller:</span>
                    <p className="text-muted-foreground">{book.seller.first_name} {book.seller.last_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Stock:</span>
                    <p className="text-muted-foreground">{book.quantity} available</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{book.description}</p>
                </div>

                {/* Purchase Section - Only show for non-sellers */}
                {user && !user.is_seller && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-4 mb-4">
                      <Label htmlFor="quantity">Quantity:</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={book.quantity}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, book.quantity))}
                        className="w-20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddToCart}
                        disabled={book.quantity === 0}
                        className="flex-1"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {book.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Seller Section - Show for all users except the seller */}
                {user && user.id !== book.seller.id && (
                  <div className="border-t pt-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleMessageSeller}
                        variant="outline"
                        className="flex-1"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message Seller
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Care Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Care Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Store books in a cool, dry place</li>
                  <li>• Keep books away from direct sunlight</li>
                  <li>• Use bookmarks instead of folding pages</li>
                  <li>• Don't write in books unless they're specifically designed for it</li>
                  <li>• Keep food and drinks away from books</li>
                </ul>
              </CardContent>
            </Card>

            {/* Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Why Choose BookZone?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm">Quality Guaranteed</h4>
                      <p className="text-xs text-muted-foreground">
                        All books are carefully inspected and condition-rated
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm">Fast Shipping</h4>
                      <p className="text-xs text-muted-foreground">
                        Free shipping with tracking and insurance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm">Easy Returns</h4>
                      <p className="text-xs text-muted-foreground">
                        30-day return policy for your satisfaction
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="mt-12 space-y-8">
          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{review.reviewer.first_name} {review.reviewer.last_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No reviews yet. Be the first to review this book!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Review Form - Only show if user can review */}
          {user && canReview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Write a Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showReviewForm ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rating" className="text-sm font-medium">Rating</Label>
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewRating(i + 1)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${i < reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">{reviewRating} out of 5</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="comment" className="text-sm font-medium">Review</Label>
                      <textarea
                        id="comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your thoughts about this book..."
                        className="w-full mt-2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="flex-1"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewComment('');
                          setReviewRating(5);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      Share your experience with this book!
                    </p>
                    <Button onClick={() => setShowReviewForm(true)}>
                      Write a Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>You Might Also Like</CardTitle>
                <CardDescription>Books similar to this one</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendations.slice(0, 4).map((recBook) => (
                    <Link key={recBook.id} href={`/books/${recBook.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          <div className="aspect-[3/4] bg-muted rounded-lg mb-3 overflow-hidden">
                            {recBook.cover_image ? (
                              <img
                                src={getImageUrl(recBook.cover_image)}
                                alt={recBook.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-muted-foreground text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm line-clamp-2 mb-1">{recBook.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">by {recBook.author}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-primary">
                              Rs {recBook.price}
                            </span>
                            <span className={`px-1 py-0.5 rounded text-xs font-medium ${getConditionColor(recBook.condition)}`}>
                              {recBook.condition.replace('_', ' ')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
