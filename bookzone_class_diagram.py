import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch
import numpy as np

# Set up the figure
fig, ax = plt.subplots(1, 1, figsize=(20, 16))
ax.set_xlim(0, 20)
ax.set_ylim(0, 20)
ax.axis('off')

# Colors
primary_color = '#A4D7C7'  # BookZone primary color
secondary_color = '#F4F1EB'  # Background color
accent_color = '#2D3748'
text_color = '#1A202C'

# Font settings
title_font = {'fontsize': 16, 'fontweight': 'bold', 'color': text_color}
class_font = {'fontsize': 10, 'fontweight': 'bold', 'color': text_color}
field_font = {'fontsize': 8, 'color': text_color}
method_font = {'fontsize': 8, 'color': text_color, 'style': 'italic'}

# Class definitions with positions
classes = {
    'User': {
        'pos': (2, 16),
        'width': 3.5,
        'height': 4,
        'fields': [
            '+UUID id',
            '+String username',
            '+String email',
            '+String first_name',
            '+String last_name',
            '+String password',
            '+Boolean is_seller',
            '+DateTime created_at',
            '+DateTime updated_at'
        ],
        'methods': [
            '+create_user()',
            '+create_superuser()'
        ]
    },
    'Book': {
        'pos': (7, 16),
        'width': 3.5,
        'height': 4.5,
        'fields': [
            '+UUID id',
            '+String title',
            '+String author',
            '+String description',
            '+String isbn',
            '+Decimal price',
            '+Integer quantity',
            '+String condition',
            '+String cover_image',
            '+DateTime created_at',
            '+DateTime updated_at',
            '+ForeignKey seller',
            '+ForeignKey category'
        ],
        'methods': [
            '+get_absolute_url()',
            '+get_cover_image()'
        ]
    },
    'Category': {
        'pos': (12, 16),
        'width': 3,
        'height': 2.5,
        'fields': [
            '+UUID id',
            '+String name',
            '+String description',
            '+String image',
            '+DateTime created_at'
        ],
        'methods': [
            '+__str__()'
        ]
    },
    'Order': {
        'pos': (2, 10),
        'width': 3.5,
        'height': 3.5,
        'fields': [
            '+UUID id',
            '+String order_number',
            '+String status',
            '+Decimal total_amount',
            '+String shipping_address',
            '+String customer_name',
            '+String customer_email',
            '+DateTime created_at',
            '+DateTime updated_at',
            '+ForeignKey customer'
        ],
        'methods': [
            '+generate_order_number()',
            '+calculate_total()'
        ]
    },
    'OrderItem': {
        'pos': (7, 10),
        'width': 3,
        'height': 2.5,
        'fields': [
            '+UUID id',
            '+Integer quantity',
            '+Decimal price',
            '+ForeignKey order',
            '+ForeignKey book'
        ],
        'methods': [
            '+get_total()'
        ]
    },
    'Review': {
        'pos': (12, 10),
        'width': 3,
        'height': 2.5,
        'fields': [
            '+UUID id',
            '+Integer rating',
            '+String comment',
            '+DateTime created_at',
            '+ForeignKey book',
            '+ForeignKey user'
        ],
        'methods': [
            '+get_rating_display()'
        ]
    },
    'Conversation': {
        'pos': (2, 4),
        'width': 3.5,
        'height': 2.5,
        'fields': [
            '+UUID id',
            '+DateTime created_at',
            '+DateTime updated_at',
            '+Boolean is_active',
            '+ForeignKey buyer',
            '+ForeignKey seller'
        ],
        'methods': [
            '+get_unread_count()',
            '+get_last_message()'
        ]
    },
    'Message': {
        'pos': (7, 4),
        'width': 3.5,
        'height': 3,
        'fields': [
            '+UUID id',
            '+String content',
            '+Boolean is_read',
            '+DateTime created_at',
            '+ForeignKey conversation',
            '+ForeignKey sender',
            '+ForeignKey book'
        ],
        'methods': [
            '+mark_as_read()',
            '+get_book_reference()'
        ]
    },
    'Cart': {
        'pos': (12, 4),
        'width': 3,
        'height': 2.5,
        'fields': [
            '+UUID id',
            '+DateTime created_at',
            '+DateTime updated_at',
            '+ForeignKey user'
        ],
        'methods': [
            '+get_total_items()',
            '+get_total_price()'
        ]
    },
    'CartItem': {
        'pos': (16, 4),
        'width': 3,
        'height': 2.5,
        'fields': [
            '+UUID id',
            '+Integer quantity',
            '+DateTime created_at',
            '+ForeignKey cart',
            '+ForeignKey book'
        ],
        'methods': [
            '+get_total_price()'
        ]
    },
    'Wishlist': {
        'pos': (16, 10),
        'width': 3,
        'height': 2,
        'fields': [
            '+UUID id',
            '+DateTime created_at',
            '+ForeignKey user',
            '+ForeignKey book'
        ],
        'methods': [
            '+add_to_wishlist()',
            '+remove_from_wishlist()'
        ]
    }
}

# Draw classes
for class_name, class_info in classes.items():
    x, y = class_info['pos']
    width = class_info['width']
    height = class_info['height']
    
    # Draw class box
    box = FancyBboxPatch(
        (x, y), width, height,
        boxstyle="round,pad=0.1",
        facecolor=secondary_color,
        edgecolor=primary_color,
        linewidth=2
    )
    ax.add_patch(box)
    
    # Draw class name
    ax.text(x + width/2, y + height - 0.3, class_name, 
            ha='center', va='top', **class_font)
    
    # Draw separator line
    ax.plot([x + 0.1, x + width - 0.1], [y + height - 0.6, y + height - 0.6], 
            color=primary_color, linewidth=1)
    
    # Draw fields
    field_y = y + height - 1
    for field in class_info['fields']:
        ax.text(x + 0.1, field_y, field, ha='left', va='top', **field_font)
        field_y -= 0.25
    
    # Draw separator line for methods
    if class_info['methods']:
        ax.plot([x + 0.1, x + width - 0.1], [field_y + 0.1, field_y + 0.1], 
                color=primary_color, linewidth=1)
        
        # Draw methods
        method_y = field_y - 0.1
        for method in class_info['methods']:
            ax.text(x + 0.1, method_y, method, ha='left', va='top', **method_font)
            method_y -= 0.25

# Define relationships
relationships = [
    ('User', 'Book', 'sells', '1', '*'),
    ('User', 'Order', 'places', '1', '*'),
    ('User', 'Review', 'writes', '1', '*'),
    ('User', 'Conversation', 'participates', '1', '*'),
    ('User', 'Message', 'sends', '1', '*'),
    ('User', 'Cart', 'has', '1', '1'),
    ('User', 'Wishlist', 'has', '1', '*'),
    
    ('Category', 'Book', 'categorizes', '1', '*'),
    
    ('Book', 'OrderItem', 'included_in', '1', '*'),
    ('Book', 'Review', 'reviewed', '1', '*'),
    ('Book', 'Message', 'referenced_in', '1', '*'),
    ('Book', 'CartItem', 'added_to', '1', '*'),
    ('Book', 'Wishlist', 'wishlisted', '1', '*'),
    
    ('Order', 'OrderItem', 'contains', '1', '*'),
    
    ('Conversation', 'Message', 'contains', '1', '*'),
    
    ('Cart', 'CartItem', 'contains', '1', '*'),
]

# Draw relationships
for rel in relationships:
    class1, class2, label, card1, card2 = rel
    
    # Get positions
    pos1 = classes[class1]['pos']
    pos2 = classes[class2]['pos']
    
    # Calculate connection points
    x1, y1 = pos1[0] + classes[class1]['width']/2, pos1[1] + classes[class1]['height']/2
    x2, y2 = pos2[0] + classes[class2]['width']/2, pos2[1] + classes[class2]['height']/2
    
    # Draw arrow
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=accent_color, lw=1.5))
    
    # Add relationship label
    mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
    ax.text(mid_x, mid_y, label, ha='center', va='center', 
            fontsize=7, color=accent_color, 
            bbox=dict(boxstyle="round,pad=0.2", facecolor='white', alpha=0.8))
    
    # Add cardinality
    ax.text(x1 + (x2-x1)*0.2, y1 + (y2-y1)*0.2, card1, ha='center', va='center',
            fontsize=6, color=accent_color, weight='bold')
    ax.text(x1 + (x2-x1)*0.8, y1 + (y2-y1)*0.8, card2, ha='center', va='center',
            fontsize=6, color=accent_color, weight='bold')

# Add title
ax.text(10, 19.5, 'BookZone - Class Diagram', ha='center', va='top', **title_font)

# Add legend
legend_elements = [
    patches.Patch(color=secondary_color, label='Class'),
    patches.Patch(color=primary_color, label='Relationship')
]
ax.legend(handles=legend_elements, loc='upper right', bbox_to_anchor=(0.98, 0.98))

# Add design patterns note
ax.text(1, 1, 'Design Patterns:\n• MVC Pattern (Django)\n• Repository Pattern (API Views)\n• Observer Pattern (Messaging)\n• Factory Pattern (User/Book Creation)', 
        fontsize=8, color=text_color, 
        bbox=dict(boxstyle="round,pad=0.5", facecolor=secondary_color, alpha=0.8))

plt.tight_layout()
plt.savefig('bookzone_class_diagram.png', dpi=300, bbox_inches='tight', 
            facecolor='white', edgecolor='none')
plt.show()

print("Class diagram saved as 'bookzone_class_diagram.png'")
