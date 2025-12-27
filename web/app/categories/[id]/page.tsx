'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { booksAPI, categoriesAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Search, Filter, Heart, ShoppingCart, Star, ChevronLeft, Grid, List } from 'lucide-react';
import { getFallbackImage } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Category {
    id: string;
    name: string;
    description?: string;
    created_at: string;
}

interface Book {
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
    images: Array<{
        id: string;
        image: string;
        caption?: string;
    }>;
}

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = params.id as string;
    const { addItem } = useCart();
    const { user } = useAuth();

    const [category, setCategory] = useState<Category | null>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (categoryId) {
            fetchCategoryDetails();
            fetchBooks();
        }
    }, [categoryId, searchTerm, conditionFilter, priceRange]);

    const fetchCategoryDetails = async () => {
        try {
            const response = await categoriesAPI.getById(categoryId);
            setCategory(response.data);
        } catch (error) {
            console.error('Error fetching category details:', error);
            toast.error('Failed to load category details');
        }
    };

    const fetchBooks = async () => {
        try {
            const params: any = { category: categoryId };
            if (searchTerm) params.search = searchTerm;
            if (conditionFilter) params.condition = conditionFilter;
            if (priceRange.min) params.min_price = priceRange.min;
            if (priceRange.max) params.max_price = priceRange.max;

            const response = await booksAPI.getAll(params);
            setBooks(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching books:', error);
            toast.error('Failed to load books');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToWishlist = async (bookId: string) => {
        try {
            await booksAPI.addToWishlist(bookId);
            toast.success('Added to wishlist!');
        } catch (error) {
            toast.error('Failed to add to wishlist');
        }
    };

    const handleAddToCart = (book: Book) => {
        addItem({
            id: book.id,
            title: book.title,
            author: book.author,
            price: book.price,
            cover_image: book.cover_image,
        });
        toast.success('Added to cart!');
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

    if (!category) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="text-center py-12">
                    <CardContent>
                        <h3 className="text-lg font-medium">Category not found</h3>
                        <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
                        <Button onClick={() => router.push('/categories')} className="mt-4">
                            Back to Categories
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" onClick={() => router.push('/categories')}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back to Categories
                        </Button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
                            <p className="text-muted-foreground">
                                {category.description || `Browse all books in ${category.name}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search & Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Search</label>
                                <Input
                                    placeholder="Search by title, author, ISBN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Condition</label>
                                <select
                                    value={conditionFilter}
                                    onChange={(e) => setConditionFilter(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">All Conditions</option>
                                    <option value="new">New</option>
                                    <option value="like_new">Like New</option>
                                    <option value="very_good">Very Good</option>
                                    <option value="good">Good</option>
                                    <option value="acceptable">Acceptable</option>
                                    <option value="poor">Poor</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Price Range</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Min"
                                        type="number"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Max"
                                        type="number"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Books Grid/List */}
                {books.length > 0 ? (
                    <div className={viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "space-y-4"
                    }>
                        {books.map((book) => (
                            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                {viewMode === 'grid' ? (
                                    <div className="aspect-[3/4] relative overflow-hidden">
                                        {/* Image Gallery */}
                                        <div className="w-full h-full relative">
                                            {(book.cover_image || book.images.length > 0) ? (
                                                <div className="w-full h-full">
                                                    {/* Main Image */}
                                                    <img
                                                        src={book.cover_image || book.images[0]?.image}
                                                        alt={book.title}
                                                        className="w-full h-full object-cover"
                                                    />

                                                    {/* Image Counter Badge */}
                                                    {(book.cover_image && book.images.length > 0) && (
                                                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                                            +{book.images.length} more
                                                        </div>
                                                    )}

                                                    {/* Image Gallery Preview */}
                                                    {(book.cover_image && book.images.length > 0) && (
                                                        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                                                            {book.images.slice(0, 3).map((img, index) => (
                                                                <div key={img.id} className="w-8 h-8 rounded overflow-hidden border border-white">
                                                                    <img
                                                                        src={img.image}
                                                                        alt={`${book.title} ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                            {book.images.length > 3 && (
                                                                <div className="w-8 h-8 rounded bg-black/70 text-white text-xs flex items-center justify-center border border-white">
                                                                    +{book.images.length - 3}
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
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 p-4">
                                        <div className="w-20 h-24 flex-shrink-0 overflow-hidden rounded">
                                            {book.cover_image ? (
                                                <img
                                                    src={book.cover_image}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
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
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg truncate">{book.title}</h3>
                                            <p className="text-muted-foreground text-sm">by {book.author}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span className="font-bold text-primary">Rs {book.price}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(book.condition)}`}>
                                                    {formatCondition(book.condition)}
                                                </span>
                                                <span className="text-muted-foreground">{book.seller.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        {viewMode === 'grid' && (
                                            <>
                                                <h3 className="font-semibold text-lg line-clamp-2">{book.title}</h3>
                                                <p className="text-muted-foreground text-sm">by {book.author}</p>
                                            </>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-primary">Rs {book.price}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(book.condition)}`}>
                                                {formatCondition(book.condition)}
                                            </span>
                                        </div>

                                        {viewMode === 'grid' && (
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>{book.category.name}</span>
                                                <span>{book.seller.email}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <Button asChild size="sm" className="flex-1">
                                                <Link href={`/books/${book.id}`}>
                                                    View Details
                                                </Link>
                                            </Button>
                                            {user && !user.is_seller && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAddToCart(book)}
                                                >
                                                    <ShoppingCart className="h-4 w-4" />
                                                </Button>
                                            )}
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
                                <Search className="h-12 w-12 mx-auto text-muted-foreground" />
                                <h3 className="text-lg font-medium">No books found</h3>
                                <p className="text-muted-foreground">
                                    {searchTerm || conditionFilter || priceRange.min || priceRange.max
                                        ? 'Try adjusting your search criteria or browse all books in this category'
                                        : `No books available in ${category.name} at the moment.`
                                    }
                                </p>
                                {(searchTerm || conditionFilter || priceRange.min || priceRange.max) && (
                                    <Button onClick={() => {
                                        setSearchTerm('');
                                        setConditionFilter('');
                                        setPriceRange({ min: '', max: '' });
                                    }}>
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
