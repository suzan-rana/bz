import base64
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from books.models import Book, BookImage, Category
from chat_messages.models import Conversation, Message
from orders.models import Order, OrderItem
from reviews.models import Review, Wishlist

User = get_user_model()

# Tiny 1x1 PNG used for placeholder cover/additional images
SAMPLE_IMAGE_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/Ur0Yf8AAAAASUVORK5CYII="
)


class Command(BaseCommand):
    help = "Populate the database with demo users, books, orders, and related objects"

    def handle(self, *args, **options):
        self.stdout.write("Populating database with demo data...")

        with transaction.atomic():
            categories = self._ensure_categories()
            sellers, buyers = self._ensure_users()
            books = self._ensure_books(categories, sellers)
            self._ensure_reviews_and_wishlists(books, buyers)
            self._ensure_orders(books, buyers)
            self._ensure_conversations(books, sellers, buyers)

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data ready: {len(categories)} categories, "
                f"{len(books)} books, {len(sellers)} sellers, {len(buyers)} buyers."
            )
        )

    def _image_file(self, filename: str) -> ContentFile:
        """Return an in-memory file for image fields."""
        return ContentFile(SAMPLE_IMAGE_BYTES, name=filename)

    def _ensure_categories(self):
        categories_data = [
            ("Fiction", "Imaginative literature including novels and short stories"),
            ("Non-Fiction", "Factual literature including biographies and history"),
            ("Science Fiction", "Fiction dealing with futuristic concepts"),
            ("Fantasy", "Fiction involving magical elements"),
            ("Mystery & Thriller", "Suspenseful fiction with crime elements"),
            ("Romance", "Fiction focusing on romantic relationships"),
            ("Biography & Memoir", "Non-fiction about people's lives"),
            ("History", "Non-fiction about past events"),
            ("Science & Technology", "Non-fiction about scientific discoveries"),
            ("Self-Help", "Non-fiction focused on personal development"),
            ("Business & Economics", "Non-fiction about commerce and finance"),
            ("Young Adult", "Fiction written for teenage readers"),
        ]

        categories = {}
        for name, description in categories_data:
            category, created = Category.objects.get_or_create(
                name=name, defaults={"description": description}
            )
            categories[name] = category
            action = "Created" if created else "Loaded existing"
            self.stdout.write(f"{action} category: {name}")

        return categories

    def _ensure_users(self):
        user_definitions = [
            {
                "username": "seller1",
                "email": "seller1@example.com",
                "first_name": "John",
                "last_name": "Smith",
                "is_seller": True,
                "phone": "555-0001",
                "address": "742 Evergreen Terrace, Springfield",
            },
            {
                "username": "seller2",
                "email": "seller2@example.com",
                "first_name": "Sarah",
                "last_name": "Johnson",
                "is_seller": True,
                "phone": "555-0002",
                "address": "31 Spooner Street, Quahog",
            },
            {
                "username": "seller3",
                "email": "seller3@example.com",
                "first_name": "Michael",
                "last_name": "Brown",
                "is_seller": True,
                "phone": "555-0003",
                "address": "2211 North 1st Street, San Jose",
            },
            {
                "username": "buyer1",
                "email": "buyer1@example.com",
                "first_name": "Emily",
                "last_name": "Davis",
                "is_seller": False,
                "phone": "555-1001",
                "address": "221B Baker Street, London",
            },
            {
                "username": "buyer2",
                "email": "buyer2@example.com",
                "first_name": "David",
                "last_name": "Wilson",
                "is_seller": False,
                "phone": "555-1002",
                "address": "12 Grimmauld Place, London",
            },
        ]

        sellers, buyers = [], []
        for data in user_definitions:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username": data["username"],
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "is_seller": data["is_seller"],
                    "is_active": True,
                    "phone": data["phone"],
                    "address": data["address"],
                },
            )

            if created:
                user.set_password("password123")
                user.save()
                self.stdout.write(f"Created user: {user.email}")
            else:
                self.stdout.write(f"Loaded existing user: {user.email}")

            if user.is_seller:
                sellers.append(user)
            else:
                buyers.append(user)

        return sellers, buyers

    def _ensure_books(self, categories, sellers):
        if not sellers:
            raise RuntimeError("At least one seller is required to seed books.")

        books_data = [
            {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "category": "Fiction",
                "description": "A classic American novel about the Jazz Age.",
                "price": Decimal("12.99"),
                "condition": "good",
                "quantity": 5,
            },
            {
                "title": "1984",
                "author": "George Orwell",
                "category": "Science Fiction",
                "description": "A dystopian novel about totalitarianism.",
                "price": Decimal("11.99"),
                "condition": "good",
                "quantity": 4,
            },
            {
                "title": "The Hobbit",
                "author": "J.R.R. Tolkien",
                "category": "Fantasy",
                "description": "A fantasy novel about a hobbit's journey.",
                "price": Decimal("16.99"),
                "condition": "like_new",
                "quantity": 3,
            },
            {
                "title": "Atomic Habits",
                "author": "James Clear",
                "category": "Self-Help",
                "description": "Practical guide to building good habits.",
                "price": Decimal("17.50"),
                "condition": "new",
                "quantity": 6,
            },
            {
                "title": "Sapiens",
                "author": "Yuval Noah Harari",
                "category": "History",
                "description": "Exploration of how Homo sapiens became dominant.",
                "price": Decimal("18.25"),
                "condition": "very_good",
                "quantity": 4,
            },
            {
                "title": "The Power of Now",
                "author": "Eckhart Tolle",
                "category": "Self-Help",
                "description": "Mindfulness practices for everyday life.",
                "price": Decimal("13.99"),
                "condition": "good",
                "quantity": 5,
            },
            {
                "title": "The Martian",
                "author": "Andy Weir",
                "category": "Science Fiction",
                "description": "A stranded astronaut fights to survive on Mars.",
                "price": Decimal("14.50"),
                "condition": "like_new",
                "quantity": 4,
            },
            {
                "title": "Educated",
                "author": "Tara Westover",
                "category": "Biography & Memoir",
                "description": "A memoir about a woman who pursues learning.",
                "price": Decimal("15.99"),
                "condition": "good",
                "quantity": 3,
            },
            {
                "title": "Project Hail Mary",
                "author": "Andy Weir",
                "category": "Science Fiction",
                "description": "A lone astronaut has to save humanity.",
                "price": Decimal("19.00"),
                "condition": "new",
                "quantity": 5,
            },
            {
                "title": "Pride and Prejudice",
                "author": "Jane Austen",
                "category": "Romance",
                "description": "Classic romance between Elizabeth Bennet and Mr. Darcy.",
                "price": Decimal("9.50"),
                "condition": "acceptable",
                "quantity": 8,
            },
        ]

        books = {}
        for index, data in enumerate(books_data):
            category = categories[data["category"]]
            seller = sellers[index % len(sellers)]
            book, created = Book.objects.get_or_create(
                title=data["title"],
                author=data["author"],
                seller=seller,
                defaults={
                    "description": data["description"],
                    "price": data["price"],
                    "condition": data["condition"],
                    "category": category,
                    "quantity": data["quantity"],
                    "is_active": True,
                },
            )

            if created:
                cover_name = f"{slugify(book.title)}-cover.png"
                book.cover_image.save(cover_name, self._image_file(cover_name), save=False)
                book.save()
                self.stdout.write(f"Created book: {book.title}")
            else:
                self.stdout.write(f"Loaded existing book: {book.title}")

            if book.images.count() == 0:
                for image_index in range(1, 3):
                    BookImage.objects.create(
                        book=book,
                        image=self._image_file(f"{slugify(book.title)}-{image_index}.png"),
                        caption=f"{book.title} detail {image_index}",
                    )

            books[book.title] = book

        return books

    def _ensure_reviews_and_wishlists(self, books, buyers):
        buyers_by_email = {buyer.email: buyer for buyer in buyers}

        review_samples = [
            {
                "book": "The Great Gatsby",
                "buyer": "buyer1@example.com",
                "rating": 5,
                "comment": "Loved the storytelling and atmosphere.",
            },
            {
                "book": "1984",
                "buyer": "buyer2@example.com",
                "rating": 4,
                "comment": "Chilling vision of the future.",
            },
            {
                "book": "Atomic Habits",
                "buyer": "buyer1@example.com",
                "rating": 5,
                "comment": "Actionable advice for real life.",
            },
        ]

        for sample in review_samples:
            book = books.get(sample["book"])
            reviewer = buyers_by_email.get(sample["buyer"])
            if not book or not reviewer:
                continue

            _, created = Review.objects.update_or_create(
                book=book,
                reviewer=reviewer,
                defaults={"rating": sample["rating"], "comment": sample["comment"]},
            )
            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} review for {book.title} by {reviewer.email}")

        wishlist_pairs = [
            ("buyer1@example.com", "Project Hail Mary"),
            ("buyer1@example.com", "Educated"),
            ("buyer2@example.com", "The Martian"),
            ("buyer2@example.com", "The Power of Now"),
        ]

        for buyer_email, book_title in wishlist_pairs:
            buyer = buyers_by_email.get(buyer_email)
            book = books.get(book_title)
            if not buyer or not book:
                continue

            _, created = Wishlist.objects.get_or_create(user=buyer, book=book)
            action = "Added to" if created else "Already in"
            self.stdout.write(f"{action} wishlist: {book.title} for {buyer.email}")

    def _ensure_orders(self, books, buyers):
        buyers_by_email = {buyer.email: buyer for buyer in buyers}

        orders_data = [
            {
                "buyer": "buyer1@example.com",
                "customer_name": "Emily Davis",
                "customer_email": "buyer1@example.com",
                "customer_phone": "555-1001",
                "shipping_address": "221B Baker Street, London",
                "status": "processing",
                "payment_status": "completed",
                "payment_method": "khalti",
                "items": [
                    {"book": "The Great Gatsby", "quantity": 1},
                    {"book": "Atomic Habits", "quantity": 2},
                ],
            },
            {
                "buyer": "buyer2@example.com",
                "customer_name": "David Wilson",
                "customer_email": "buyer2@example.com",
                "customer_phone": "555-1002",
                "shipping_address": "12 Grimmauld Place, London",
                "status": "shipped",
                "payment_status": "completed",
                "payment_method": "cod",
                "items": [
                    {"book": "1984", "quantity": 1},
                    {"book": "The Power of Now", "quantity": 1},
                ],
            },
        ]

        for order_payload in orders_data:
            buyer = buyers_by_email.get(order_payload["buyer"])
            if not buyer:
                continue

            order_items = []
            total_amount = Decimal("0.00")
            for item in order_payload["items"]:
                book = books.get(item["book"])
                if not book:
                    continue
                order_items.append((book, item["quantity"]))
                total_amount += book.price * item["quantity"]

            if not order_items:
                continue

            order, created = Order.objects.get_or_create(
                buyer=buyer,
                shipping_address=order_payload["shipping_address"],
                customer_email=order_payload["customer_email"],
                defaults={
                    "customer_name": order_payload["customer_name"],
                    "customer_phone": order_payload["customer_phone"],
                    "status": order_payload["status"],
                    "payment_status": order_payload["payment_status"],
                    "payment_method": order_payload["payment_method"],
                    "total_amount": total_amount,
                },
            )

            if not created and order.total_amount != total_amount:
                order.total_amount = total_amount
                order.save(update_fields=["total_amount"])

            if order.items.count() == 0:
                for book, quantity in order_items:
                    OrderItem.objects.create(
                        order=order,
                        book=book,
                        quantity=quantity,
                        price=book.price,
                    )

            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} order for {order.customer_name}")

    def _ensure_conversations(self, books, sellers, buyers):
        sellers_by_email = {seller.email: seller for seller in sellers}
        buyers_by_email = {buyer.email: buyer for buyer in buyers}
        user_lookup = {**sellers_by_email, **buyers_by_email}

        conversations = [
            {
                "buyer": "buyer1@example.com",
                "seller": "seller1@example.com",
                "book": "The Great Gatsby",
                "messages": [
                    {
                        "sender": "buyer1@example.com",
                        "content": "Hi! Is this still available?",
                    },
                    {
                        "sender": "seller1@example.com",
                        "content": "Yes, it is. Happy to answer any questions!",
                    },
                ],
            },
            {
                "buyer": "buyer2@example.com",
                "seller": "seller2@example.com",
                "book": "The Power of Now",
                "messages": [
                    {
                        "sender": "buyer2@example.com",
                        "content": "Can you tell me about the book's condition?",
                    },
                    {
                        "sender": "seller2@example.com",
                        "content": "It's gently used with no markings.",
                    },
                ],
            },
        ]

        for convo in conversations:
            buyer = buyers_by_email.get(convo["buyer"])
            seller = sellers_by_email.get(convo["seller"])
            book = books.get(convo["book"])
            if not buyer or not seller:
                continue

            conversation, created = Conversation.objects.get_or_create(
                buyer=buyer, seller=seller, defaults={"is_active": True}
            )
            action = "Created" if created else "Loaded existing"
            self.stdout.write(f"{action} conversation between {buyer.email} and {seller.email}")

            for message_data in convo["messages"]:
                sender = user_lookup.get(message_data["sender"])
                if not sender:
                    continue

                exists = Message.objects.filter(
                    conversation=conversation,
                    sender=sender,
                    content=message_data["content"],
                ).exists()
                if exists:
                    continue

                Message.objects.create(
                    conversation=conversation,
                    sender=sender,
                    book=book,
                    content=message_data["content"],
                )
