import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  /**
   * MVP stub. Wire this up to Stripe/Razorpay once the provider decision from
   * the PRD's open questions (§10) is made. The idempotency check below is
   * the part that actually matters architecturally, and it's already in place:
   * a retried checkout call with the same key returns the same payment record
   * instead of charging twice.
   */
  async charge(orderId: string, amount: number, idempotencyKey: string): Promise<Payment> {
    const existing = await this.paymentsRepository.findOne({ where: { idempotencyKey } });
    if (existing) {
      return existing;
    }

    const payment = this.paymentsRepository.create({
      orderId,
      amount,
      provider: 'stub',
      status: PaymentStatus.SUCCEEDED, // TODO: replace with real provider call
      idempotencyKey,
    });
    return this.paymentsRepository.save(payment);
  }

  async refund(orderId: string): Promise<Payment | null> {
    const payment = await this.paymentsRepository.findOne({ where: { orderId } });
    if (!payment) return null;
    payment.status = PaymentStatus.REFUNDED;
    return this.paymentsRepository.save(payment);
  }
}
