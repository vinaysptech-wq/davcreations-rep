const prisma = require('../../../lib/prisma');

const createSupportTicket = async (ticketData) => {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        user_id: ticketData.user_id,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority || 'medium',
        status: ticketData.status || 'open',
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return ticket;
  } catch (error) {
    throw new Error(`Failed to create support ticket: ${error.message}`);
  }
};

const getSupportTickets = async (where = {}, page = 1, limit = 10) => {
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return { tickets, total };
  } catch (error) {
    throw new Error(`Failed to get support tickets: ${error.message}`);
  }
};

const getSupportTicketById = async (id) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        ticket_id: parseInt(id),
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return ticket;
  } catch (error) {
    throw new Error(`Failed to get support ticket: ${error.message}`);
  }
};

const updateSupportTicket = async (id, ticketData) => {
  try {
    const updateData = {
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority,
      status: ticketData.status,
      updated_at: new Date(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const ticket = await prisma.supportTicket.update({
      where: {
        ticket_id: parseInt(id),
      },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return ticket;
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