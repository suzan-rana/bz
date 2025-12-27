#!/usr/bin/env python3
"""
Simple BookZone Class Diagram Generator
Creates a text-based class diagram that can be converted to PNG
"""

def create_class_diagram():
    diagram = """
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BookZone - Class Diagram                               │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      User       │    │      Book       │    │    Category     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ +UUID id        │    │ +UUID id        │    │ +UUID id        │
│ +String username│    │ +String title   │    │ +String name    │
│ +String email   │    │ +String author  │    │ +String desc    │
│ +String f_name  │    │ +String desc    │    │ +String image   │
│ +String l_name  │    │ +String isbn    │    │ +DateTime created│
│ +String password│    │ +Decimal price  │    └─────────────────┘
│ +Boolean seller │    │ +Integer qty    │             │
│ +DateTime created│    │ +String condition│            │
│ +DateTime updated│    │ +String cover  │            │
└─────────────────┘    │ +DateTime created│            │
         │              │ +DateTime updated│            │
         │              │ +FK seller       │            │
         │              │ +FK category     │            │
         │              └─────────────────┘            │
         │                       │                      │
         │                       │                      │
         │                       └──────────────────────┘
         │
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Order       │    │   OrderItem     │    │     Review      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ +UUID id        │    │ +UUID id        │    │ +UUID id        │
│ +String number  │    │ +Integer qty    │    │ +Integer rating │
│ +String status  │    │ +Decimal price  │    │ +String comment │
│ +Decimal total  │    │ +FK order       │    │ +DateTime created│
│ +String address │    │ +FK book        │    │ +FK book        │
│ +String c_name  │    └─────────────────┘    │ +FK user        │
│ +String c_email │             │             └─────────────────┘
│ +DateTime created│            │
│ +DateTime updated│            │
│ +FK customer     │            │
└─────────────────┘            │
         │                      │
         │                      │
         └──────────────────────┘
                │
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Conversation   │    │     Message     │    │      Cart       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ +UUID id        │    │ +UUID id        │    │ +UUID id        │
│ +DateTime created│    │ +String content │    │ +DateTime created│
│ +DateTime updated│    │ +Boolean read   │    │ +DateTime updated│
│ +Boolean active │    │ +DateTime created│    │ +FK user        │
│ +FK buyer       │    │ +FK conversation│    └─────────────────┘
│ +FK seller      │    │ +FK sender      │             │
└─────────────────┘    │ +FK book        │             │
         │              └─────────────────┘             │
         │                       │                      │
         └───────────────────────┼──────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐    ┌─────────────────┐
                        │   CartItem      │    │    Wishlist     │
                        ├─────────────────┤    ├─────────────────┤
                        │ +UUID id        │    │ +UUID id        │
                        │ +Integer qty    │    │ +DateTime created│
                        │ +DateTime created│    │ +FK user        │
                        │ +FK cart        │    │ +FK book        │
                        │ +FK book        │    └─────────────────┘
                        └─────────────────┘

Relationships:
• User (1) ── sells ──> Book (*)
• User (1) ── places ──> Order (*)
• User (1) ── writes ──> Review (*)
• User (1) ── participates ──> Conversation (*)
• User (1) ── sends ──> Message (*)
• User (1) ── has ──> Cart (1)
• User (1) ── has ──> Wishlist (*)

• Category (1) ── categorizes ──> Book (*)

• Book (1) ── included_in ──> OrderItem (*)
• Book (1) ── reviewed ──> Review (*)
• Book (1) ── referenced_in ──> Message (*)
• Book (1) ── added_to ──> CartItem (*)
• Book (1) ── wishlisted ──> Wishlist (*)

• Order (1) ── contains ──> OrderItem (*)
• Conversation (1) ── contains ──> Message (*)
• Cart (1) ── contains ──> CartItem (*)

Design Patterns:
• MVC Pattern (Django Framework)
• Repository Pattern (API Views)
• Observer Pattern (Messaging System)
• Factory Pattern (User/Book Creation)

Key Features:
• UUID Primary Keys for security
• Soft Deletes (is_active flags)
• Audit Fields (created_at, updated_at)
• Foreign Key Relationships
• Many-to-Many through junction tables
"""
    return diagram

if __name__ == "__main__":
    diagram = create_class_diagram()
    print(diagram)
    
    # Save to file
    with open('bookzone_class_diagram.txt', 'w') as f:
        f.write(diagram)
    
    print("\nDiagram saved to 'bookzone_class_diagram.txt'")
    print("You can copy this text and convert it to PNG using online tools like:")
    print("- https://www.text2png.com/")
    print("- https://convertio.co/text-png/")
    print("- Or use any text editor with export to image feature")

