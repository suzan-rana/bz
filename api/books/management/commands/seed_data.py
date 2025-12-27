from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from books.models import Category, Book
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with sample categories and books'

    def handle(self, *args, **options):
        self.stdout.write('Starting to seed database...')
        
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

        # Create sample users if they don't exist
        sellers = []
        for i in range(1, 4):
            username = f'seller{i}'
            email = f'seller{i}@example.com'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': f'Seller{i}',
                    'last_name': 'Smith',
                    'is_seller': True,
                    'is_active': True
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created seller: {user.username}')
            sellers.append(user)

        # Sample books data
        books_data = [
            {
                'title': 'The Great Gatsby',
                'author': 'F. Scott Fitzgerald',
                'description': 'A classic American novel about the Jazz Age.',
                'price': 12.99,
                'condition': 'good',
                'category_name': 'Fiction',
                'quantity': 3
            },
            {
                'title': '1984',
                'author': 'George Orwell',
                'description': 'A dystopian novel about totalitarianism.',
                'price': 11.99,
                'condition': 'good',
                'category_name': 'Science Fiction',
                'quantity': 4
            },
            {
                'title': 'The Hobbit',
                'author': 'J.R.R. Tolkien',
                'description': 'A fantasy novel about a hobbit\'s journey.',
                'price': 16.99,
                'condition': 'like_new',
                'category_name': 'Fantasy',
                'quantity': 2
            },
            {
                'title': 'Pride and Prejudice',
                'author': 'Jane Austen',
                'description': 'A classic romance novel.',
                'price': 9.99,
                'condition': 'acceptable',
                'category_name': 'Romance',
                'quantity': 5
            },
            {
                'title': 'Steve Jobs',
                'author': 'Walter Isaacson',
                'description': 'A comprehensive biography of Apple\'s co-founder.',
                'price': 18.99,
                'condition': 'very_good',
                'category_name': 'Biography & Memoir',
                'quantity': 2
            },
            {
                'title': 'Sapiens',
                'author': 'Yuval Noah Harari',
                'description': 'An exploration of how humans became dominant.',
                'price': 15.99,
                'condition': 'good',
                'category_name': 'History',
                'quantity': 4
            },
            {
                'title': 'Atomic Habits',
                'author': 'James Clear',
                'description': 'A guide to building good habits.',
                'price': 16.99,
                'condition': 'like_new',
                'category_name': 'Self-Help',
                'quantity': 3
            },
            {
                'title': 'The Martian',
                'author': 'Andy Weir',
                'description': 'A science fiction novel about an astronaut on Mars.',
                'price': 12.99,
                'condition': 'good',
                'category_name': 'Science Fiction',
                'quantity': 4
            },
            {
                'title': 'The Hunger Games',
                'author': 'Suzanne Collins',
                'description': 'A dystopian novel about a televised battle.',
                'price': 11.99,
                'condition': 'very_good',
                'category_name': 'Young Adult',
                'quantity': 5
            },
            {
                'title': 'Rich Dad Poor Dad',
                'author': 'Robert T. Kiyosaki',
                'description': 'A personal finance book about building wealth.',
                'price': 12.99,
                'condition': 'acceptable',
                'category_name': 'Business & Economics',
                'quantity': 4
            },
            {
                'title': 'The Da Vinci Code',
                'author': 'Dan Brown',
                'description': 'A thriller about a religious mystery.',
                'price': 13.99,
                'condition': 'good',
                'category_name': 'Mystery & Thriller',
                'quantity': 3
            },
            {
                'title': 'The Psychology of Money',
                'author': 'Morgan Housel',
                'description': 'Timeless lessons on wealth and happiness.',
                'price': 19.99,
                'condition': 'new',
                'category_name': 'Business & Economics',
                'quantity': 2
            },
            {
                'title': 'The Power of Now',
                'author': 'Eckhart Tolle',
                'description': 'A guide to spiritual enlightenment.',
                'price': 13.99,
                'condition': 'good',
                'category_name': 'Self-Help',
                'quantity': 4
            },
            {
                'title': 'The Alchemist',
                'author': 'Paulo Coelho',
                'description': 'A novel about following your dreams.',
                'price': 10.99,
                'condition': 'acceptable',
                'category_name': 'Fiction',
                'quantity': 7
            },
        ]

        # Create books
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
                    books_created += 1
                    self.stdout.write(f'Created book: {book.title} by {book.author}')
                else:
                    self.stdout.write(f'Book already exists: {book.title}')
                    
            except Category.DoesNotExist:
                self.stdout.write(f'Category not found: {book_data["category_name"]}')
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded database with {len(categories)} categories and {books_created} books!'
            )
        )
