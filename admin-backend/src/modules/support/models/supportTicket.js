const prisma = require('../../../lib/prisma');

const createSupportTicket = async (ticketData) => {
  try {
    return await prisma.supportTicket.create({
      data: ticketData,
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
  } catch (error) {
    throw new Error(`Failed to create support ticket: ${error.message}`);
  }
};

const getSupportTickets = async (where = {}, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.supportTicket.count({ where })
    ]);

    return { tickets, total };
  } catch (error) {
    throw new Error(`Failed to get support tickets: ${error.message}`);
  }
};

const getSupportTicketById = async (ticket_id) => {
  try {
    return await prisma.supportTicket.findUnique({
      where: { ticket_id: parseInt(ticket_id) },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
  } catch (error) {
    throw new Error(`Failed to get support ticket by ID: ${error.message}`);
  }
};

const updateSupportTicket = async (ticket_id, data) => {
  try {
    return await prisma.supportTicket.update({
      where: { ticket_id: parseInt(ticket_id) },
      data,
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
  } catch (error) {
    throw new Error(`Failed to update support ticket: ${error.message}`);
  }
};

module.exports = {
  createSupportTicket,
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicket,
};