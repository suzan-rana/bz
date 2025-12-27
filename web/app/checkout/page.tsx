'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { ordersAPI } from '@/lib/api';
import { ArrowLeft, CreditCard, Wallet, Truck, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: 'khalti' | 'cod';
}

declare global {
  interface Window {
    KhaltiCheckout: any;
  }
}

export default function CheckoutPage() {
  const { state: cartState, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [khaltiLoading, setKhaltiLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutForm>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cod',
  });

  useEffect(() => {
    // Load Khalti script
    const script = document.createElement('script');
    script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/khalti-checkout.iffe.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (cartState.items.length === 0) {
      router.push('/cart');
    }
  }, [cartState.items.length, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'postalCode'];
    for (const field of requiredFields) {
      if (!formData[field as keyof CheckoutForm]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const handleKhaltiPayment = async () => {
    if (!validateForm()) return;

    setKhaltiLoading(true);
    try {
      // Create order first
      const orderData = {
        items: cartState.items.map(item => ({
          book: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address: `${formData.address}, ${formData.city} ${formData.postalCode}`,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        payment_method: 'khalti',
      };

      const orderResponse = await ordersAPI.create(orderData);
      const orderId = orderResponse.data.id;

      // Initialize Khalti checkout
      if (window.KhaltiCheckout) {
        const config = {
          publicKey: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY || 'test_public_key_dc74e0fd57cb46cd93832aee0a390234',
          productIdentity: `Order-${orderId}`,
          productName: `BookZone Order #${orderId}`,
          productUrl: window.location.origin,
          eventHandler: {
            onSuccess: async (payload: any) => {
              try {
                // Verify payment with backend
                await ordersAPI.verifyKhaltiPayment(orderId, payload.token);
                toast.success('Payment successful! Your order has been confirmed.');
                clearCart();
                router.push(`/orders/${orderId}`);
              } catch (error) {
                console.error('Payment verification error:', error);
                toast.error('Payment verification failed. Please contact support.');
              }
            },
            onError: (error: any) => {
              console.error('Khalti payment error:', error);
              toast.error('Payment failed. Please try again.');
            },
            onClose: () => {
              setKhaltiLoading(false);
            }
          },
          paymentPreference: ['KHALTI', 'EBANKING', 'MOBILE_BANKING', 'CONNECT_IPS', 'SCT'],
        };

        const checkout = new window.KhaltiCheckout(config);
        checkout.show({ amount: Math.round(cartState.total * 100) }); // Convert to paisa
      } else {
        toast.error('Khalti payment is not available. Please try again.');
      }
    } catch (error) {
      console.error('Error processing Khalti payment:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setKhaltiLoading(false);
    }
  };

  const handleCashOnDelivery = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        items: cartState.items.map(item => ({
          book: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address: `${formData.address}, ${formData.city} ${formData.postalCode}`,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        payment_method: 'cod',
      };

      const response = await ordersAPI.create(orderData);
      toast.success('Order placed successfully! You will pay on delivery.');
      clearCart();
      router.push(`/orders/${response.data.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link href="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
                <CardDescription>
                  Please provide your delivery details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Choose your preferred payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="khalti"
                      checked={formData.paymentMethod === 'khalti'}
                      onChange={handleInputChange}
                      className="text-primary"
                    />
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <span className="font-medium">Khalti Digital Wallet</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="text-primary"
                    />
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-medium">Cash on Delivery</span>
                    </div>
                  </label>
                </div>

                {formData.paymentMethod === 'khalti' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Khalti Payment:</strong> You'll be redirected to Khalti's secure payment gateway to complete your purchase.
                    </p>
                  </div>
                )}

                {formData.paymentMethod === 'cod' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Cash on Delivery:</strong> Pay with cash when your order is delivered. Additional delivery fee may apply.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartState.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Link href={`/books/${item.id}`} className="w-12 h-16 flex-shrink-0 overflow-hidden rounded hover:opacity-80 transition-opacity">
                        {item.cover_image ? (
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">No Image</span>
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/books/${item.id}`}
                          className="font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer block"
                        >
                          {item.title}
                        </Link>
                        <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium text-sm">Rs {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rs {cartState.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  {formData.paymentMethod === 'cod' && (
                    <div className="flex justify-between">
                      <span>COD Fee</span>
                      <span>Rs 2.00</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>
                        ${formData.paymentMethod === 'cod'
                          ? (cartState.total + 2).toFixed(2)
                          : cartState.total.toFixed(2)
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Buttons */}
                <div className="space-y-3 pt-4">
                  {formData.paymentMethod === 'khalti' ? (
                    <Button
                      onClick={handleKhaltiPayment}
                      disabled={khaltiLoading}
                      className="w-full"
                    >
                      {khaltiLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-4 w-4" />
                          <span>Pay with Khalti</span>
                        </div>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCashOnDelivery}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Place Order (Cash on Delivery)</span>
                        </div>
                      )}
                    </Button>
                  )}
                </div>

                {/* Security Notice */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment powered by Khalti</span>
                </div>

                {/* Continue Shopping */}
                <div className="border-t pt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/books">
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
