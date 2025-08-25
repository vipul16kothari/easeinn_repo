import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from './db';
import { payments, hotels } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize Razorpay instance
export function createRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not found. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Create Razorpay order for hotel subscriptions
export async function createSubscriptionOrder(hotelId: string, amount: number, planName: string) {
  const razorpay = createRazorpayInstance();
  
  const receiptId = `R${Math.random().toString(36).substr(2, 8)}`;

  
  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    receipt: receiptId,
    notes: {
      hotel_id: hotelId,
      plan: planName,
      type: 'subscription'
    }
  };

  try {
    const order = await razorpay.orders.create(options);
    
    // Save payment record
    await db.insert(payments).values({
      hotelId,
      razorpayOrderId: order.id,
      amount: amount.toString(),
      paymentType: 'subscription',
      description: `${planName} subscription for hotel`,
      receiptId: options.receipt,
      paymentStatus: 'pending'
    });

    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

// Create order for advance booking payments
export async function createBookingOrder(hotelId: string, amount: number, bookingId: string, guestName: string) {
  const razorpay = createRazorpayInstance();
  
  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    receipt: `booking_${bookingId}_${Date.now()}`,
    notes: {
      hotel_id: hotelId,
      booking_id: bookingId,
      guest_name: guestName,
      type: 'booking'
    }
  };

  try {
    const order = await razorpay.orders.create(options);
    
    // Save payment record
    await db.insert(payments).values({
      hotelId,
      razorpayOrderId: order.id,
      amount: amount.toString(),
      paymentType: 'booking',
      description: `Advance payment for booking by ${guestName}`,
      receiptId: options.receipt,
      paymentStatus: 'pending'
    });

    return order;
  } catch (error) {
    console.error('Error creating booking order:', error);
    throw new Error('Failed to create booking payment order');
  }
}

// Verify Razorpay payment signature
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay key secret not found');
  }

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
}

// Verify Razorpay webhook signature
export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay key secret not found');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

// Update payment status after successful payment
export async function updatePaymentStatus(
  razorpayOrderId: string, 
  razorpayPaymentId: string, 
  signature: string,
  status: 'success' | 'failed' | 'captured' | 'authorized'
) {
  try {
    const [payment] = await db
      .update(payments)
      .set({
        razorpayPaymentId,
        razorpaySignature: signature,
        paymentStatus: status === 'captured' || status === 'authorized' ? 'success' : status,
        updatedAt: new Date()
      })
      .where(eq(payments.razorpayOrderId, razorpayOrderId))
      .returning();

    return payment;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error('Failed to update payment status');
  }
}

// Update payment status from webhook
export async function updatePaymentStatusFromWebhook(
  razorpayPaymentId: string,
  status: string,
  webhookData: any
) {
  try {
    let paymentStatus: 'success' | 'failed' | 'pending' = 'pending';
    
    switch (status) {
      case 'captured':
      case 'authorized':
        paymentStatus = 'success';
        break;
      case 'failed':
        paymentStatus = 'failed';
        break;
      default:
        paymentStatus = 'pending';
    }

    const [payment] = await db
      .update(payments)
      .set({
        paymentStatus,
        updatedAt: new Date(),
        // Store additional webhook data for debugging
        razorpaySignature: webhookData.signature || null
      })
      .where(eq(payments.razorpayPaymentId, razorpayPaymentId))
      .returning();

    return payment;
  } catch (error) {
    console.error('Error updating payment status from webhook:', error);
    throw new Error('Failed to update payment status from webhook');
  }
}

// Get payment by Razorpay payment ID
export async function getPaymentByPaymentId(razorpayPaymentId: string) {
  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, razorpayPaymentId));

    return payment;
  } catch (error) {
    console.error('Error fetching payment by payment ID:', error);
    throw new Error('Failed to fetch payment');
  }
}

// Check payment status with Razorpay API
export async function checkPaymentStatusWithAPI(razorpayPaymentId: string) {
  const razorpay = createRazorpayInstance();
  
  try {
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      captured: payment.captured,
      method: payment.method
    };
  } catch (error) {
    console.error('Error checking payment status with API:', error);
    throw new Error('Failed to check payment status');
  }
}

// Create Razorpay customer for hotel
export async function createRazorpayCustomer(hotelId: string, hotelName: string, email: string, phone?: string) {
  const razorpay = createRazorpayInstance();
  
  try {
    const customer = await razorpay.customers.create({
      name: hotelName,
      email: email,
      contact: phone,
      notes: {
        hotel_id: hotelId
      }
    });

    // Update hotel with Razorpay customer ID
    await db
      .update(hotels)
      .set({ razorpayCustomerId: customer.id })
      .where(eq(hotels.id, hotelId));

    return customer;
  } catch (error) {
    console.error('Error creating Razorpay customer:', error);
    throw new Error('Failed to create customer');
  }
}

// Get payment history for a hotel
export async function getHotelPayments(hotelId: string) {
  try {
    const paymentHistory = await db
      .select()
      .from(payments)
      .where(eq(payments.hotelId, hotelId))
      .orderBy(payments.createdAt);

    return paymentHistory;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw new Error('Failed to fetch payment history');
  }
}