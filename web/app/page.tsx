'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Book, Category } from '@/lib/api';
import { booksAPI, categoriesAPI } from '@/lib/api';
import Link from 'next/link';
import { Search, BookOpen, Star, ShoppingCart, Sparkles, TrendingUp, Clock, X } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [topSoldBooks, setTopSoldBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksResponse, topSoldResponse, categoriesResponse] = await Promise.all([
          booksAPI.getAll({ ordering: '-created_at' }),
          booksAPI.getTopSold(),
          categoriesAPI.getAll()
        ]);
        setBooks(booksResponse.data.results || booksResponse.data);
        setTopSoldBooks(topSoldResponse.data.results || topSoldResponse.data);
        setCategories(categoriesResponse.data.results || categoriesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Load recent searches from localStorage
    const saved = localStorage.getItem('bookzone-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

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

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      // Save to recent searches
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('bookzone-recent-searches', JSON.stringify(updated));

      // Navigate to browse books page with search query
      window.location.href = `/books?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

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

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
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
      very_good: 'bg-yellow-100 text-yellow-800',
      good: 'bg-orange-100 text-orange-800',
      acceptable: 'bg-red-100 text-red-800',
      poor: 'bg-gray-100 text-gray-800',
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Welcome to{' '}
              <span className="text-primary">BookZone</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your premier marketplace for buying and selling books. Discover rare finds,
              share your collection, and connect with fellow book lovers.
            </p>

            {/* Minimal Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8" ref={searchRef}>
              <div className={`relative flex items-center bg-white border rounded-lg shadow-sm transition-all duration-300 ${isSearchFocused ? 'border-primary shadow-md' : 'border-gray-300 hover:border-gray-400'
                }`}>
                <div className="flex items-center pl-5 pr-3 py-3 flex-1">
                  <div className="flex items-center justify-center w-6 h-6">
                    <Search className={`h-4 w-4 transition-colors ${isSearchFocused ? 'text-primary' : 'text-gray-400'
                      }`} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for books, authors, or categories..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      setShowSuggestions(true);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-gray-400 text-base ml-4"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={() => handleSearch()}
                  className="rounded-l-md mr-1 px-3 py-3 bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto search-suggestions-enter">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && !searchQuery && (
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center mb-3">
                        <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <div key={index} className="flex items-center justify-between group">
                            <button
                              onClick={() => handleSearch(search)}
                              className="flex items-center flex-1 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                            >
                              <Search className="h-4 w-4 text-muted-foreground mr-3" />
                              <span className="text-sm">{search}</span>
                            </button>
                            <button
                              onClick={() => removeRecentSearch(search)}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Suggestions */}
                  {searchQuery && searchSuggestions.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <Sparkles className="h-4 w-4 text-primary mr-2" />
                        <span className="text-sm font-medium text-muted-foreground">Suggestions</span>
                      </div>
                      <div className="space-y-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(suggestion)}
                            className="flex items-center w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                          >
                            <TrendingUp className="h-4 w-4 text-muted-foreground mr-3" />
                            <span className="text-sm">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="p-4 border-t border-border">
                    <div className="flex items-center mb-3">
                      <BookOpen className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm font-medium text-muted-foreground">Quick Actions</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSearch('fiction')}
                        className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="text-sm">Fiction Books</span>
                      </button>
                      <button
                        onClick={() => handleSearch('non-fiction')}
                        className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="text-sm">Non-Fiction</span>
                      </button>
                      <button
                        onClick={() => handleSearch('textbook')}
                        className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="text-sm">Textbooks</span>
                      </button>
                      <button
                        onClick={() => handleSearch('new')}
                        className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="text-sm">New Arrivals</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/books">Browse Books</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sell">Sell Your Books</Link>
              </Button>
            </div>
          </div>

          {/* Top Sold Books */}
          {topSoldBooks.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-center mb-8">Top Selling Books</h2>
              <div className="space-y-8">
                {/* First Row - 4 cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {topSoldBooks.slice(0, 4).map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="aspect-[3/4] bg-muted rounded-lg mb-4 overflow-hidden">
                            {book.cover_image ? (
                              <img
                                src={getImageUrl(book.cover_image)}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-base line-clamp-2 mb-2">{book.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">by {book.author}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              Rs {book.price}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getConditionColor(book.condition)}`}>
                              {book.condition.replace('_', ' ')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Second Row - 4 cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {topSoldBooks.slice(4, 8).map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="aspect-[3/4] bg-muted rounded-lg mb-4 overflow-hidden">
                            {book.cover_image ? (
                              <img
                                src={getImageUrl(book.cover_image)}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-base line-clamp-2 mb-2">{book.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">by {book.author}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              Rs {book.price}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getConditionColor(book.condition)}`}>
                              {book.condition.replace('_', ' ')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <Link key={category.id} href={`/categories/${category.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Books Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Latest Books</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.slice(0, 8).map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4">
                  <div className="aspect-[3/4] bg-muted rounded-lg mb-4 overflow-hidden">
                    {book.cover_image ? (
                      <img
                        src={getImageUrl(book.cover_image)}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    by {book.author}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary">
                      Rs {book.price}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(book.condition)}`}>
                      {book.condition.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= book.average_rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({book.review_count})
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/books/${book.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/books">View All Books</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose BookZone?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Vast Collection</h3>
                <p className="text-muted-foreground">
                  Browse through thousands of books from various genres and conditions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Easy Buying</h3>
                <p className="text-muted-foreground">
                  Simple and secure checkout process with buyer protection.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Quality Assured</h3>
                <p className="text-muted-foreground">
                  Detailed condition descriptions and seller ratings for peace of mind.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
