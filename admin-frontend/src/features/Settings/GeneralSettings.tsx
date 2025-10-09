"use client";

import React from 'react';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import { Modal } from '../../components/ui/modal';
import Alert from '../../components/ui/alert/Alert';
import { useSettings } from './hooks';

const GeneralSettings: React.FC = () => {
  const {
    settings,
    loading,
    error,
    success,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    editingSetting,
    newKey,
    setNewKey,
    newValue,
    setNewValue,
    editValue,
    setEditValue,
    handleAddSetting,
    handleEditSetting,
    handleDeleteSetting,
    openEditModalForSetting,
  } = useSettings();

  if (loading) {
    return (
      <>
        <PageBreadCrumb pageTitle="Settings" />
        <div className="space-y-6">
          <ComponentCard title="System Settings">
            <div className="p-6 text-center">
              <p>Loading settings...</p>
            </div>
          </ComponentCard>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Settings" />
      <div className="space-y-6">
        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}
        {success && (
          <Alert variant="success" title="Success" message={success} />
        )}

        <ComponentCard title="System Settings">
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                Manage global site and system settings. These settings control various aspects
                of the application behavior and configuration.
              </p>
            </div>

            <div className="mb-4">
              <Button onClick={openAddModal} size="sm">
                Add New Setting
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Key
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Value
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Created
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {settings.map((setting) => (
                        <TableRow key={setting.setting_key}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {setting.setting_key}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {setting.setting_value}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {new Date(setting.created_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => openEditModalForSetting(setting)}
                                size="sm"
                                variant="outline"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteSetting(setting.setting_key)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {settings.length === 0 && (
              <div className="mt-6 text-center text-gray-500">
                No settings found. Click &apos;Add New Setting&apos; to create your first setting.
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* Add Setting Modal */}
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} className="max-w-md mx-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add New Setting
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Setting Key *
              </label>
              <Input
                type="text"
                placeholder="e.g., SITE_NAME"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Setting Value *
              </label>
              <Input
                type="text"
                placeholder="Enter value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button onClick={closeAddModal} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleAddSetting}>
                Add Setting
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Setting Modal */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-md mx-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Edit Setting
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Setting Key
              </label>
              <Input
                type="text"
                value={editingSetting?.setting_key || ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Setting Value *
              </label>
              <Input
                type="text"
                placeholder="Enter value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button onClick={closeEditModal} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleEditSetting}>
                Update Setting
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GeneralSettings;