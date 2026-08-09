import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

class OrderItemDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Deliberately no unitPrice/price field here — the server prices every
  // item from the real menu record (see OrdersService.create). Trusting a
  // client-supplied price is how you let someone order food for ₹1.
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  deliveryAddress: string;

  @IsNumber()
  deliveryLat: number;

  @IsNumber()
  deliveryLng: number;
}
