import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const LEGACY_LINE_FIELDS = [
  'description',
  'quantity',
  'unit',
  'unitPriceCents',
] as const;

@ValidatorConstraint({ name: 'exclusiveLineItemFormat', async: false })
export class ExclusiveLineItemFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(items: unknown, args: ValidationArguments): boolean {
    if (items === undefined) return true;
    const payload = args.object as Record<string, unknown>;
    return LEGACY_LINE_FIELDS.every((field) => payload[field] === undefined);
  }

  defaultMessage(): string {
    return 'Envía items o los campos escalares, pero no ambos.';
  }
}
