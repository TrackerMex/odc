export class Supplier {
  constructor(
    public readonly id: string | null,
    public name: string,
    public createdAt: Date | null,
  ) {}
}
