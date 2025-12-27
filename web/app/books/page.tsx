'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { booksAPI, categoriesAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Heart, ShoppingCart, Star, Shield, Truck, Clock, BookOpen, Sparkles, TrendingUp, X } from 'lucide-react';
import { getFallbackImage, getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

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

interface Category {
    id: string;
    name: string;
}

export default function BooksPage() {
    const searchParams = useSearchParams();
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const { addItem } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        // Check for search query in URL parameters
        const searchQuery = searchParams.get('search');
        if (searchQuery && searchQuery !== searchTerm) {
            setSearchTerm(searchQuery);
        }

        fetchBooks();
        fetchCategories();

        // Load recent searches from localStorage
        const saved = localStorage.getItem('bookzone-recent-searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading recent searches:', error);
            }
        }
    }, [selectedCategory, conditionFilter, priceRange, searchParams]);

    // Handle search term changes
    useEffect(() => {
        fetchBooks();
    }, [searchTerm]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
                setIsSearchFocused(false);
            }
        }

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuggestions]);

    const fetchBooks = async () => {
        try {
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.category = selectedCategory;
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

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
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

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Update URL with search parameter
        const url = new URL(window.location.href);
        if (value.trim()) {
            url.searchParams.set('search', value);
        } else {
            url.searchParams.delete('search');
        }
        window.history.replaceState({}, '', url.toString());

        if (value.trim()) {
            // Generate search suggestions based on books and categories
            const suggestions = [
                ...books.filter(book =>
                    book.title.toLowerCase().includes(value.toLowerCase()) ||
                    book.author.toLowerCase().includes(value.toLowerCase())
                ).map(book => book.title),
                ...categories.filter(cat =>
                    cat.name.toLowerCase().includes(value.toLowerCase())
                ).map(cat => cat.name),
                ...recentSearches.filter(search =>
                    search.toLowerCase().includes(value.toLowerCase())
                )
            ].slice(0, 5);

            setSearchSuggestions(Array.from(new Set(suggestions)));
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSearchSuggestion = (suggestion: string) => {
        setSearchTerm(suggestion);
        setShowSuggestions(false);
        setIsSearchFocused(false);

        // Update URL with selected suggestion
        const url = new URL(window.location.href);
        url.searchParams.set('search', suggestion);
        window.history.replaceState({}, '', url.toString());

        // Save to recent searches
        const updated = [suggestion, ...recentSearches.filter(s => s !== suggestion)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('bookzone-recent-searches', JSON.stringify(updated));

        // The search will automatically trigger due to the useEffect dependency on searchTerm
    };

    const clearSearch = () => {
        setSearchTerm('');
        setShowSuggestions(false);
        setIsSearchFocused(false);

        // Update URL to remove search parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        window.history.replaceState({}, '', url.toString());
    };

    const removeRecentSearch = (search: string) => {
        const updated = recentSearches.filter(s => s !== search);
        setRecentSearches(updated);
        localStorage.setItem('bookzone-recent-searches', JSON.stringify(updated));
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
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Browse Books</h1>
                            <p className="text-muted-foreground">Discover amazing books from our community of sellers</p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/categories">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Browse by Category
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Enhanced Search and Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search & Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2 relative" ref={searchRef}>
                                <label className="text-sm font-medium">Search</label>
                                <div className={`relative flex items-center bg-background border-2 rounded-lg transition-all duration-300 ${isSearchFocused ? 'border-primary shadow-primary/20 search-glow' : 'border-border hover:border-primary/50'
                                    }`}>
                                    <div className="flex items-center pl-3 pr-2 py-2 flex-1">
                                        <Search className={`h-4 w-4 mr-2 transition-colors ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'
                                            }`} />
                                        <input
                                            type="text"
                                            placeholder="Search by title, author, ISBN..."
                                            value={searchTerm}
                                            onChange={handleSearchInputChange}
                                            onFocus={() => {
                                                setIsSearchFocused(true);
                                                setShowSuggestions(true);
                                            }}
                                            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={clearSearch}
                                                className="ml-1 p-1 hover:bg-muted rounded transition-colors"
                                            >
                                                <X className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Search Suggestions Dropdown */}
                                {showSuggestions && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto search-suggestions-enter">
                                        {/* Recent Searches */}
                                        {recentSearches.length > 0 && !searchTerm && (
                                            <div className="p-3 border-b border-border">
                                                <div className="flex items-center mb-2">
                                                    <Clock className="h-3 w-3 text-muted-foreground mr-2" />
                                                    <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {recentSearches.map((search, index) => (
                                                        <div key={index} className="flex items-center justify-between group">
                                                            <button
                                                                onClick={() => handleSearchSuggestion(search)}
                                                                className="flex items-center flex-1 p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                                                            >
                                                                <Search className="h-3 w-3 text-muted-foreground mr-2" />
                                                                <span className="text-xs">{search}</span>
                                                            </button>
                                                            <button
                                                                onClick={() => removeRecentSearch(search)}
                                                                className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                                                            >
                                                                <X className="h-2.5 w-2.5 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Search Suggestions */}
                                        {searchTerm && searchSuggestions.length > 0 && (
                                            <div className="p-3">
                                                <div className="flex items-center mb-2">
                                                    <Sparkles className="h-3 w-3 text-primary mr-2" />
                                                    <span className="text-xs font-medium text-muted-foreground">Suggestions</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {searchSuggestions.map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleSearchSuggestion(suggestion)}
                                                            className="flex items-center w-full p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                                                        >
                                                            <TrendingUp className="h-3 w-3 text-muted-foreground mr-2" />
                                                            <span className="text-xs">{suggestion}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quick Actions */}
                                        <div className="p-3 border-t border-border">
                                            <div className="flex items-center mb-2">
                                                <BookOpen className="h-3 w-3 text-primary mr-2" />
                                                <span className="text-xs font-medium text-muted-foreground">Quick Actions</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                                <button
                                                    onClick={() => handleSearchSuggestion('fiction')}
                                                    className="flex items-center p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                                                >
                                                    <span className="text-xs">Fiction</span>
                                                </button>
                                                <button
                                                    onClick={() => handleSearchSuggestion('non-fiction')}
                                                    className="flex items-center p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                                                >
                                                    <span className="text-xs">Non-Fiction</span>
                                                </button>
                                                <button
                                                    onClick={() => handleSearchSuggestion('textbook')}
                                                    className="flex items-center p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                                                >
                                                    <span className="text-xs">Textbooks</span>
                                                </button>
                                                <button
                                                    onClick={() => handleSearchSuggestion('new')}
                                                    className="flex items-center p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                                                >
                                                    <span className="text-xs">New</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
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

                {/* Books Grid */}
                {books.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {books.map((book) => (
                            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-[3/4] relative overflow-hidden">
                                    {/* Image Gallery */}
                                    <div className="w-full h-full relative">
                                        {book.cover_image ? (
                                            <div className="w-full h-full">
                                                {/* Main Image (Cover image only) */}
                                                <img
                                                    src={getImageUrl(book.cover_image)}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Image Counter Badge */}
                                                {book.images.length > 0 && (
                                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                                        +{book.images.length} more
                                                    </div>
                                                )}

                                                {/* Image Gallery Preview (small thumbnails) */}
                                                {book.images.length > 0 && (
                                                    <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                                                        {book.images.slice(0, 3).map((img, index) => (
                                                            <div key={img.id} className="w-8 h-8 rounded overflow-hidden border border-white">
                                                                <img
                                                                    src={getImageUrl(img.image)}
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
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                <img
                                                    src={getFallbackImage(book.title, book.author, 'book')}
                                                    alt={`Cover for ${book.title}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Wishlist Button - Only show for non-sellers */}
                                    {user && !user.is_seller && (
                                        <div className="absolute top-2 right-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleAddToWishlist(book.id)}
                                                className="bg-background/80 hover:bg-background"
                                            >
                                                <Heart className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-lg line-clamp-2">{book.title}</h3>
                                        <p className="text-muted-foreground text-sm">by {book.author}</p>

                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-primary">Rs {book.price}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(book.condition)}`}>
                                                {formatCondition(book.condition)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>{book.category.name}</span>
                                            <span>{book.seller.email}</span>
                                        </div>

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
                                    Try adjusting your search criteria or browse all books
                                </p>
                                <Button onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('');
                                    setConditionFilter('');
                                    setPriceRange({ min: '', max: '' });
                                }}>
                                    Clear Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
