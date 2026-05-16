export const PAYMENT_METHODS = [
  'Transferencia',
  'Efectivo',
  'Tarjeta',
  'Deposito',
  'Otro',
]

export const PAYMENT_TYPES = ['Anticipo', 'Liquidacion', 'Pago completo']

export const initialPayments = [
  {
    id: 'pay-001',
    clientName: 'Andrea Lopez',
    productId: 'prod-002',
    productName: 'Bolsa piel mini taupe',
    items: [
      {
        id: 'pay-001-item-001',
        productId: 'prod-002',
        name: 'Bolsa piel mini taupe',
        category: 'Bolsas',
        quantity: 1,
        price: 3650,
      },
      {
        id: 'pay-001-item-002',
        productId: '',
        name: 'Perfume floral importado',
        category: 'Perfumes',
        quantity: 1,
        price: 1250,
      },
    ],
    purchaseTotal: 4900,
    amount: 1500,
    method: 'Transferencia',
    type: 'Anticipo',
    paymentDate: '2026-05-13',
    notes: 'Apartado recibido, resta liquidacion.',
    createdAt: '2026-05-13T13:10:00.000Z',
  },
  {
    id: 'pay-002',
    clientName: 'Camila Ruiz',
    productId: 'prod-004',
    productName: 'Vestido negro halter',
    items: [
      {
        id: 'pay-002-item-001',
        productId: 'prod-004',
        name: 'Vestido negro halter',
        category: 'Vestidos',
        quantity: 1,
        price: 2350,
      },
    ],
    purchaseTotal: 2350,
    amount: 2350,
    method: 'Transferencia',
    type: 'Pago completo',
    paymentDate: '2026-05-10',
    notes: 'Pago completo confirmado.',
    createdAt: '2026-05-10T12:25:00.000Z',
  },
  {
    id: 'pay-003',
    clientName: 'Regina Santos',
    productId: 'prod-006',
    productName: 'Set joyeria perla',
    items: [
      {
        id: 'pay-003-item-001',
        productId: 'prod-006',
        name: 'Set joyeria perla',
        category: 'Accesorios',
        quantity: 1,
        price: 1180,
      },
    ],
    purchaseTotal: 1180,
    amount: 600,
    method: 'Efectivo',
    type: 'Anticipo',
    paymentDate: '2026-05-08',
    notes: 'Entrega pendiente.',
    createdAt: '2026-05-08T20:05:00.000Z',
  },
]
