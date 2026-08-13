import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  @Post('webhook')
  handleWebhook(@Body() payload: unknown) {
    // TODO: verify the provider's signature and update the payment status
    // once Stripe/Razorpay is actually wired in.
    return { received: true };
  }
}
