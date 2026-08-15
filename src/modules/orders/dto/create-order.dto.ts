import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class OrderItemDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Fix: OrderItem.notes existed on the entity but was never reachable from
  // the request — a standard "special instructions" field (e.g. "no onions")
  // caused the whole order to be rejected (forbidNonWhitelisted) rather than
  // just being ignored.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;

  // Deliberately no unitPrice/price field here — the server prices every
  // item from the real menu record (see OrdersService.create). Trusting a
  // client-supplied price is how you let someone order food for ₹1.
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId: string;

  @IsArray()
  @ArrayMinSize(1) // fix: an empty array previously produced a valid ₹0-item, delivery-fee-only "order"
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  deliveryAddress: string;

  @IsNumber()
  deliveryLat: number;

  @IsNumber()
  deliveryLng: number;

  // Fix: standard "leave at door" / "ring the bell" instructions had no
  // field to go into at all before this.
  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryInstructions?: string;
}
