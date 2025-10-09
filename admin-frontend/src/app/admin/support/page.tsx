'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import PageBreadCrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import InputField from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import TextArea from '../../../components/form/input/TextArea';
import Button from '../../../components/ui/button/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import Badge from '../../../components/ui/badge/Badge';
import { supportApi } from '../../../shared/utils/apiClient';

interface TicketFormData {
  subject: string;
  description: string;
  priority: string;
}

interface SupportTicket {
  ticket_id: number;
  subject: string;
  description: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  user: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TicketFormData>({
    defaultValues: {
      subject: '',
      description: '',
      priority: 'medium',
    },
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportApi.getTickets();
      setTickets((response.data as { tickets: SupportTicket[] }).tickets || []);
    } catch (err) {
      setError('Failed to fetch support tickets');
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TicketFormData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await supportApi.createTicket(data);
      setSuccess('Support ticket created successfully');
      reset();
      fetchTickets(); // Refresh the list
    } catch (err: unknown) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'warning';
      case 'closed': return 'success';
      case 'pending': return 'info';
      default: return 'light';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'light';
    }
  };

  return (
    <>
      <PageBreadCrumb pageTitle="Support" />
      <div className="space-y-6">
        {/* Create Ticket Form */}
        <ComponentCard title="Create Support Ticket">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <InputField
                    {...register('subject', { required: 'Subject is required' })}
                    type="text"
                    placeholder="Brief description of the issue"
                    error={!!errors.subject}
                    hint={errors.subject?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                    placeholder="Select priority"
                    onChange={(value) => register('priority').onChange({ target: { value } })}
                    defaultValue="medium"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <TextArea
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Detailed description of your issue or question"
                  rows={4}
                  error={!!errors.description}
                  hint={errors.description?.message}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-600">{success}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </form>
          </div>
        </ComponentCard>

        {/* Tickets List */}
        <ComponentCard title="Your Support Tickets">
          <div className="p-6">
            {loading ? (
              <div className="text-center">
                <p>Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No support tickets found.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Create your first ticket using the form above.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                            Subject
                          </TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                            Status
                          </TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                            Priority
                          </TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                            Created
                          </TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                            Last Updated
                          </TableCell>
                        </TableRow>
                      </TableHeader>

                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {tickets.map((ticket) => (
                          <TableRow key={ticket.ticket_id}>
                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                              <div>
                                <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                  {ticket.subject}
                                </span>
                                <span className="block text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                                  {ticket.description.length > 100
                                    ? `${ticket.description.substring(0, 100)}...`
                                    : ticket.description}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              <Badge size="sm" color={getStatusColor(ticket.status)}>
                                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              <Badge size="sm" color={getPriorityColor(ticket.priority)}>
                                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {new Date(ticket.updated_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </>
  );
}