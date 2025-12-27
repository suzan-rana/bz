from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from books.models import Category, Book, BookImage
import random
import requests
from io import BytesIO
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with sample categories, books, and users with default images'

    def download_image(self, url, filename):
        """Download an image from URL and return a ContentFile"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return ContentFile(response.content, name=filename)
        except Exception as e:
            self.stdout.write(f'Failed to download image from {url}: {e}')
            return None

    def handle(self, *args, **options):
        self.stdout.write('Starting to seed database with images...')
        
        # Create categories
        categories_data = [
            {'name': 'Fiction', 'description': 'Imaginative literature including novels and short stories'},
            {'name': 'Non-Fiction', 'description': 'Factual literature including biographies and history'},
            {'name': 'Science Fiction', 'description': 'Fiction dealing with futuristic concepts'},
            {'name': 'Fantasy', 'description': 'Fiction involving magical elements'},
            {'name': 'Mystery & Thriller', 'description': 'Suspenseful fiction with crime elements'},
            {'name': 'Romance', 'description': 'Fiction focusing on romantic relationships'},
            {'name': 'Biography & Memoir', 'description': 'Non-fiction about people\'s lives'},
            {'name': 'History', 'description': 'Non-fiction about past events'},
            {'name': 'Science & Technology', 'description': 'Non-fiction about scientific discoveries'},
            {'name': 'Self-Help', 'description': 'Non-fiction focused on personal development'},
            {'name': 'Business & Economics', 'description': 'Non-fiction about commerce and finance'},
            {'name': 'Young Adult', 'description': 'Fiction written for teenage readers'},
        ]

        categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {category.name}')
            else:
                self.stdout.write(f'Category already exists: {category.name}')

        # Create sample users with profile pictures
        sellers = []
        user_data = [
            {
                'username': 'seller1',
                'email': 'seller1@example.com',
                'first_name': 'John',
                'last_name': 'Smith',
                'is_seller': True
            },
            {
                'username': 'seller2',
                'email': 'seller2@example.com',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'is_seller': True
            },
            {
                'username': 'seller3',
                'email': 'seller3@example.com',
                'first_name': 'Michael',
                'last_name': 'Brown',
                'is_seller': True
            },
            {
                'username': 'buyer1',
                'email': 'buyer1@example.com',
                'first_name': 'Emily',
                'last_name': 'Davis',
                'is_seller': False
            },
            {
                'username': 'buyer2',
                'email': 'buyer2@example.com',
                'first_name': 'David',
                'last_name': 'Wilson',
                'is_seller': False
            }
        ]

        # Default profile picture URLs (using DiceBear API for consistent avatars)
        profile_picture_urls = [
            'https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=b6e3f4',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffdfbf',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael&backgroundColor=d1d4f9',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily&backgroundColor=ffd5dc',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=c0f2d8'
        ]

        for i, user_info in enumerate(user_data):
            user, created = User.objects.get_or_create(
                username=user_info['username'],
                defaults={
                    'email': user_info['email'],
                    'first_name': user_info['first_name'],
                    'last_name': user_info['last_name'],
                    'is_seller': user_info['is_seller'],
                    'is_active': True
                }
            )
            
            if created:
                user.set_password('password123')
                
                # Add profile picture
                if i < len(profile_picture_urls):
                    profile_pic = self.download_image(
                        profile_picture_urls[i], 
                        f'profile_{user.username}.svg'
                    )
                    if profile_pic:
                        user.profile_picture.save(f'profile_{user.username}.svg', profile_pic, save=False)
                
                user.save()
                self.stdout.write(f'Created user: {user.username}')
            else:
                self.stdout.write(f'User already exists: {user.username}')
            
            if user.is_seller:
                sellers.append(user)

        # Sample books data with cover image URLs
        books_data = [
            {
                'title': 'The Great Gatsby',
                'author': 'F. Scott Fitzgerald',
                'description': 'A classic American novel about the Jazz Age.',
                'price': 12.99,
                'condition': 'good',
                'category_name': 'Fiction',
                'quantity': 3,
                'cover_url': 'https://picsum.photos/400/600?random=1'
            },
            {
                'title': '1984',
                'author': 'George Orwell',
                'description': 'A dystopian novel about totalitarianism.',
                'price': 11.99,
                'condition': 'good',
                'category_name': 'Science Fiction',
                'quantity': 4,
                'cover_url': 'https://picsum.photos/400/600?random=2'
            },
            {
                'title': 'The Hobbit',
                'author': 'J.R.R. Tolkien',
                'description': 'A fantasy novel about a hobbit\'s journey.',
                'price': 16.99,
                'condition': 'like_new',
                'category_name': 'Fantasy',
                'quantity': 2,
                'cover_url': 'https://picsum.photos/400/600?random=3'
            },
            {
                'title': 'Pride and Prejudice',
                'author': 'Jane Austen',
                'description': 'A classic romance novel.',
                'price': 9.99,
                'condition': 'acceptable',
                'category_name': 'Romance',
                'quantity': 5,
                'cover_url': 'https://picsum.photos/400/600?random=4'
            },
            {
                'title': 'Steve Jobs',
                'author': 'Walter Isaacson',
                'description': 'A comprehensive biography of Apple\'s co-founder.',
                'price': 18.99,
                'condition': 'very_good',
                'category_name': 'Biography & Memoir',
                'quantity': 2,
                'cover_url': 'https://picsum.photos/400/600?random=5'
            },
            {
                'title': 'Sapiens',
                'author': 'Yuval Noah Harari',
                'description': 'An exploration of how humans became dominant.',
                'price': 15.99,
                'condition': 'good',
                'category_name': 'History',
                'quantity': 4,
                'cover_url': 'https://picsum.photos/400/600?random=6'
            },
            {
                'title': 'Atomic Habits',
                'author': 'James Clear',
                'description': 'A guide to building good habits.',
                'price': 16.99,
                'condition': 'like_new',
                'category_name': 'Self-Help',
                'quantity': 3,
                'cover_url': 'https://picsum.photos/400/600?random=7'
            },
            {
                'title': 'The Martian',
                'author': 'Andy Weir',
                'description': 'A science fiction novel about an astronaut on Mars.',
                'price': 12.99,
                'condition': 'good',
                'category_name': 'Science Fiction',
                'quantity': 4,
                'cover_url': 'https://picsum.photos/400/600?random=8'
            },
            {
                'title': 'The Hunger Games',
                'author': 'Suzanne Collins',
                'description': 'A dystopian novel about a televised battle.',
                'price': 11.99,
                'condition': 'very_good',
                'category_name': 'Young Adult',
                'quantity': 5,
                'cover_url': 'https://picsum.photos/400/600?random=9'
            },
            {
                'title': 'Rich Dad Poor Dad',
                'author': 'Robert T. Kiyosaki',
                'description': 'A personal finance book about building wealth.',
                'price': 12.99,
                'condition': 'acceptable',
                'category_name': 'Business & Economics',
                'quantity': 4,
                'cover_url': 'https://picsum.photos/400/600?random=10'
            },
            {
                'title': 'The Da Vinci Code',
                'author': 'Dan Brown',
                'description': 'A thriller about a religious mystery.',
                'price': 13.99,
                'condition': 'good',
                'category_name': 'Mystery & Thriller',
                'quantity': 3,
                'cover_url': 'https://picsum.photos/400/600?random=11'
            },
            {
                'title': 'The Psychology of Money',
                'author': 'Morgan Housel',
                'description': 'Timeless lessons on wealth and happiness.',
                'price': 19.99,
                'condition': 'new',
                'category_name': 'Business & Economics',
                'quantity': 2,
                'cover_url': 'https://picsum.photos/400/600?random=12'
            },
            {
                'title': 'The Power of Now',
                'author': 'Eckhart Tolle',
                'description': 'A guide to spiritual enlightenment.',
                'price': 13.99,
                'condition': 'good',
                'category_name': 'Self-Help',
                'quantity': 4,
                'cover_url': 'https://picsum.photos/400/600?random=13'
            },
            {
                'title': 'The Alchemist',
                'author': 'Paulo Coelho',
                'description': 'A novel about following your dreams.',
                'price': 10.99,
                'condition': 'acceptable',
                'category_name': 'Fiction',
                'quantity': 7,
                'cover_url': 'https://picsum.photos/400/600?random=14'
            },
        ]

        # Create books with cover images
        books_created = 0
        for book_data in books_data:
            try:
                category = Category.objects.get(name=book_data['category_name'])
                seller = random.choice(sellers)
                
                book, created = Book.objects.get_or_create(
                    title=book_data['title'],
                    author=book_data['author'],
                    seller=seller,
                    defaults={
                        'description': book_data['description'],
                        'price': book_data['price'],
                        'condition': book_data['condition'],
                        'category': category,
                        'quantity': book_data['quantity'],
                        'is_active': True
                    }
                )
                
                if created:
                    # Add cover image
                    cover_image = self.download_image(
                        book_data['cover_url'], 
                        f'cover_{book.id}.jpg'
                    )
                    if cover_image:
                        book.cover_image.save(f'cover_{book.id}.jpg', cover_image, save=False)
                    
                    # Add 2-3 additional images for some books
                    if random.choice([True, False]):  # 50% chance
                        for i in range(random.randint(1, 3)):
                            additional_image = self.download_image(
                                f'https://picsum.photos/400/600?random={random.randint(100, 999)}',
                                f'book_{book.id}_img_{i+1}.jpg'
                            )
                            if additional_image:
                                BookImage.objects.create(
                                    book=book,
                                    image=additional_image,
                                    caption=f'Additional view {i+1}'
                                )
                    
                    book.save()
                    books_created += 1
                    self.stdout.write(f'Created book with images: {book.title} by {book.author}')
                else:
                    self.stdout.write(f'Book already exists: {book.title}')
                    
            except Category.DoesNotExist:
                self.stdout.write(f'Category not found: {book_data["category_name"]}')
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded database with {len(categories)} categories, {len(sellers)} sellers, and {books_created} books with images!'
            )
        )
