// Mock Prisma Client globally
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    userType: {
      findMany: jest.fn(),
    },
    adminModule: {
      findMany: jest.fn(),
    },
    userAccess: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    log: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    settings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
    $on: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Mock logger globally
jest.mock('./src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));