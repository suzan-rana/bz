from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_order_order_number'),
    ]

    operations = [
        # Drop existing tables
        migrations.RunSQL(
            "DROP TABLE IF EXISTS orders_orderitem CASCADE;",
            reverse_sql=""
        ),
        migrations.RunSQL(
            "DROP TABLE IF EXISTS orders_order CASCADE;",
            reverse_sql=""
        ),
        
        # Recreate tables with new schema
        migrations.RunSQL(
            """
            CREATE TABLE orders_order (
                id SERIAL PRIMARY KEY,
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) NOT NULL,
                payment_status VARCHAR(20) NOT NULL,
                payment_method VARCHAR(20) NOT NULL,
                shipping_address TEXT NOT NULL,
                customer_name VARCHAR(200) NOT NULL,
                customer_email VARCHAR(254) NOT NULL,
                customer_phone VARCHAR(20) NOT NULL,
                khalti_payment_id VARCHAR(100),
                khalti_transaction_id VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
                buyer_id UUID NOT NULL
            );
            """,
            reverse_sql=""
        ),
        
        migrations.RunSQL(
            """
            CREATE TABLE orders_orderitem (
                id SERIAL PRIMARY KEY,
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                order_id INTEGER NOT NULL,
                book_id UUID NOT NULL
            );
            """,
            reverse_sql=""
        ),
        
        # Add foreign key constraints
        migrations.RunSQL(
            """
            ALTER TABLE orders_order 
            ADD CONSTRAINT orders_order_buyer_id_fkey 
            FOREIGN KEY (buyer_id) REFERENCES users_user(id) DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql=""
        ),
        
        migrations.RunSQL(
            """
            ALTER TABLE orders_orderitem 
            ADD CONSTRAINT orders_orderitem_order_id_fkey 
            FOREIGN KEY (order_id) REFERENCES orders_order(id) DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql=""
        ),
        
        migrations.RunSQL(
            """
            ALTER TABLE orders_orderitem 
            ADD CONSTRAINT orders_orderitem_book_id_fkey 
            FOREIGN KEY (book_id) REFERENCES books_book(id) DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql=""
        ),
    ]
