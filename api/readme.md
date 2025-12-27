# BookZone Backend

A Django-based backend for the BookZone marketplace application.

## Project Structure

The project is organized into Django apps following best practices:

### Apps

1. **users** - User management and authentication
   - Custom User model with seller functionality
   - Authentication views (register, login, logout)
   - User profile management

2. **books** - Book and category management
   - Category model for book genres
   - Book model with condition tracking
   - BookImage model for additional images
   - Book listing and search functionality

3. **orders** - Order and transaction management
   - Order model for purchases
   - OrderItem model for individual items
   - Order status tracking

4. **reviews** - Review and wishlist functionality
   - Review model with ratings
   - Wishlist model for user book lists
   - Review management

## Setup Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Copy `env.example` to `.env` and configure:
   - Database settings
   - Django secret key
   - Redis settings
   - Other required variables

3. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

5. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

## Demo Data

Populate the local database with categories, sellers, buyers, books, reviews, wishlists, orders, and example chat conversations by running:

```bash
python manage.py populate_demo_data
```

All generated accounts use the password `password123` and the command is safe to run multiple times; it will only create missing records.

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout

### Users
- `GET /api/users/profile/` - Get user profile
- `PUT /api/users/update_profile/` - Update user profile

### Categories
- `GET /api/categories/` - List all categories
- `GET /api/categories/{id}/` - Get category details

### Books
- `GET /api/books/` - List all books (with filtering)
- `POST /api/books/` - Create new book (sellers only)
- `GET /api/books/{id}/` - Get book details
- `PUT /api/books/{id}/` - Update book
- `DELETE /api/books/{id}/` - Delete book
- `GET /api/books/my_books/` - Get seller's books
- `POST /api/books/{id}/add_to_wishlist/` - Add to wishlist
- `DELETE /api/books/{id}/remove_from_wishlist/` - Remove from wishlist

### Orders
- `GET /api/orders/` - List user's orders
- `POST /api/orders/` - Create new order
- `GET /api/orders/{id}/` - Get order details
- `PATCH /api/orders/{id}/update_status/` - Update order status (admin only)

### Reviews
- `GET /api/reviews/` - List reviews (with book filtering)
- `POST /api/reviews/` - Create new review
- `GET /api/reviews/{id}/` - Get review details
- `PUT /api/reviews/{id}/` - Update review
- `DELETE /api/reviews/{id}/` - Delete review

### Wishlist
- `GET /api/wishlist/` - Get user's wishlist
- `POST /api/wishlist/` - Add book to wishlist
- `DELETE /api/wishlist/{id}/` - Remove from wishlist

## Features

- **User Management**: Registration, login, profile management
- **Book Marketplace**: Buy and sell books with condition tracking
- **Categories**: Organize books by genre/category
- **Reviews & Ratings**: User reviews and ratings for books
- **Wishlist**: Save books for later purchase
- **Order Management**: Complete order lifecycle
- **Admin Interface**: Full Django admin integration
- **API Documentation**: Swagger/OpenAPI documentation

## Database Models

### User Model
- Extended Django User with seller functionality
- Email-based authentication
- Profile information (phone, address, profile picture)

### Book Model
- Title, author, ISBN
- Price and condition tracking
- Category and seller relationships
- Quantity and active status

### Order Model
- Buyer and total amount
- Status tracking (pending, confirmed, shipped, delivered, cancelled)
- Shipping address

### Review Model
- Rating (1-5 stars) and comment
- Unique constraint per user per book
- Timestamps for creation and updates

## Development

### Adding New Features
1. Create models in appropriate app
2. Create serializers for API
3. Create views with proper permissions
4. Add URL patterns
5. Update admin interface
6. Create and run migrations

### Testing
```bash
python manage.py test
```

### Code Style
Follow PEP 8 and Django coding standards.
