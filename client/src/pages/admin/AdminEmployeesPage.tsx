import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal.js';

import {
  UserPlus,
  Search,
  Users,
  Edit2,
  Trash2,
  KeyRound,
  UserX,
  UserCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

export const AdminEmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Form States
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [newRole, setNewRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

  const [editName, setEditName] = useState('');

  const [editRole, setEditRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [resetPassword, setResetPassword] = useState('');

  // Fetch Employees List
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['adminEmployees', filter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter === 'ACTIVE') params.append('status', 'ACTIVE');
      if (filter === 'INACTIVE') params.append('status', 'INACTIVE');
      params.append('limit', '100');

      const res = await api.get(`/employees?${params.toString()}`);
      return res.data.data;
    },
  });

  const employees = employeesData?.employees || [];

  // Create Employee
  const createEmployeeMutation = useMutation({
    mutationFn: async () => {
      return (await api.post('/employees', {
        employeeId: newEmployeeId.trim().toUpperCase(),
        name: newName.trim(),
        password: newPassword,
        role: newRole,
      })).data;
    },
    onSuccess: (resData) => {
      setCreateModalOpen(false);
      setNewEmployeeId('');
      setNewName('');
      setNewPassword('');

      success('Employee Created', resData.message || 'Account provisioned successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['adminEmployeesStats'] });
    },
    onError: (err: any) => {
      error('Creation Error', err.response?.data?.message || 'Failed to create employee account.');
    },
  });

  // Edit Employee
  const editEmployeeMutation = useMutation({
    mutationFn: async () => {
      const id = selectedUser?._id || selectedUser?.id;
      return (await api.put(`/employees/${id}`, {
        name: editName.trim(),
        role: editRole,
        status: editStatus,
      })).data;
    },
    onSuccess: (resData) => {
      setEditModalOpen(false);
      success('Employee Updated', resData.message || 'Details updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminEmployees'] });
    },
    onError: (err: any) => {
      error('Update Error', err.response?.data?.message || 'Failed to update employee.');
    },
  });

  // Reset Password
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const id = selectedUser?._id || selectedUser?.id;
      return (await api.post(`/employees/${id}/reset-password`, {
        newPassword: resetPassword,
      })).data;
    },
    onSuccess: (resData) => {
      setResetModalOpen(false);
      setResetPassword('');
      success('Password Reset', resData.message || 'New credentials issued.');
      queryClient.invalidateQueries({ queryKey: ['adminEmployees'] });
    },
    onError: (err: any) => {
      error('Reset Error', err.response?.data?.message || 'Failed to reset password.');
    },
  });

  // Delete Employee
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/employees/${id}`)).data,
    onSuccess: (resData) => {
      setDeletingUser(null);
      success('Employee Deleted', resData.message || 'Account removed.');
      queryClient.invalidateQueries({ queryKey: ['adminEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['adminEmployeesStats'] });
    },
    onError: (err: any) => {
      error('Delete Error', err.response?.data?.message || 'Failed to delete employee.');
    },
  });

  // Toggle Employee Status (Active <-> Inactive)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'ACTIVE' | 'INACTIVE'; name: string }) => {
      return (await api.put(`/employees/${id}`, { status: newStatus })).data;
    },
    onMutate: async ({ id, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['adminEmployees'] });
      queryClient.setQueriesData({ queryKey: ['adminEmployees'] }, (old: any) => {
        if (!old) return old;
        if (old.employees && Array.isArray(old.employees)) {
          return {
            ...old,
            employees: old.employees.map((emp: any) =>
              (emp._id === id || emp.id === id) ? { ...emp, status: newStatus } : emp
            )
          };
        }
        return old;
      });
    },
    onSuccess: (_, variables) => {
      success(
        variables.newStatus === 'ACTIVE' ? 'Employee Activated' : 'Employee Deactivated',
        `${variables.name} is now ${variables.newStatus === 'ACTIVE' ? 'active and can vote' : 'deactivated'}.`
      );
      queryClient.invalidateQueries({ queryKey: ['adminEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['adminEmployeesStats'] });
    },
    onError: (err: any) => {
      error('Status Update Failed', err.response?.data?.message || 'Could not update employee status.');
      queryClient.invalidateQueries({ queryKey: ['adminEmployees'] });
    },
  });

  const handleToggleStatus = (emp: any) => {
    const id = emp._id || emp.id;
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatusMutation.mutate({ id, newStatus, name: emp.name });
  };

  const openEdit = (emp: any) => {
    setSelectedUser(emp);
    setEditName(emp.name);

    setEditRole(emp.role || 'EMPLOYEE');
    setEditStatus(emp.status || 'ACTIVE');
    setEditModalOpen(true);
  };

  const openResetPassword = (emp: any) => {
    setSelectedUser(emp);
    setResetPassword('');
    setResetModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Employee Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View, add, search, and manage employee accounts and credentials.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Add Employee
        </Button>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Professional Employees Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 animate-pulse text-xs">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    No employees found matching criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp: any) => (
                  <tr key={emp._id || emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name & ID */}
                    <td className="py-3.5 px-6">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {emp.employeeId}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          emp.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {emp.role === 'ADMIN' ? 'Admin' : 'Employee'}
                      </span>
                    </td>

                    {/* Status (Clickable Quick-Toggle) */}
                    <td className="py-3.5 px-6">
                      {emp._id === currentUser?.id || emp.id === currentUser?.id ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active (You)</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(emp)}
                          disabled={toggleStatusMutation.isPending && (toggleStatusMutation.variables as any)?.id === (emp._id || emp.id)}
                          title={emp.status === 'ACTIVE' ? 'Click to Deactivate Employee' : 'Click to Activate Employee'}
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer select-none group',
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                          )}
                        >
                          <span
                            className={clsx(
                              'w-1.5 h-1.5 rounded-full transition-colors',
                              emp.status === 'ACTIVE'
                                ? 'bg-emerald-500 group-hover:bg-amber-500'
                                : 'bg-slate-400 group-hover:bg-emerald-500'
                            )}
                          />
                          <span>{emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Deactivate / Activate Button */}
                        {emp._id !== currentUser?.id && emp.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(emp)}
                            disabled={toggleStatusMutation.isPending && (toggleStatusMutation.variables as any)?.id === (emp._id || emp.id)}
                            title={emp.status === 'ACTIVE' ? 'Deactivate Employee' : 'Activate Employee'}
                            className={clsx(
                              'p-1.5 rounded-lg transition-colors cursor-pointer',
                              emp.status === 'ACTIVE'
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            )}
                            aria-label={emp.status === 'ACTIVE' ? 'Deactivate Employee' : 'Activate Employee'}
                          >
                            {emp.status === 'ACTIVE' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => openEdit(emp)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openResetPassword(emp)}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {emp._id !== currentUser?.id && emp.id !== currentUser?.id && (
                          <button
                            onClick={() => setDeletingUser(emp)}
                            title="Delete Account"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Employee Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Employee"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)} disabled={createEmployeeMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!newEmployeeId.trim() || !newName.trim() || !newPassword.trim()) {
                  error('Required Fields', 'Employee ID, name, and password are required.');
                  return;
                }
                createEmployeeMutation.mutate();
              }}
              isLoading={createEmployeeMutation.isPending}
            >
              Create Account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee ID *
            </label>
            <Input
              value={newEmployeeId}
              onChange={(e) => setNewEmployeeId(e.target.value)}
              placeholder="e.g. EMP1024"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Password *
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter initial password"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="EMPLOYEE">Employee (Voting only)</option>
              <option value="ADMIN">Administrator (Full access)</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Employee"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditModalOpen(false)} disabled={editEmployeeMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!editName.trim()) {
                  error('Validation Error', 'Full name is required.');
                  return;
                }
                editEmployeeMutation.mutate();
              }}
              isLoading={editEmployeeMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Reset Password for ${selectedUser?.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetModalOpen(false)} disabled={resetPasswordMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!resetPassword || resetPassword.length < 6) {
                  error('Validation Error', 'New password must be at least 6 characters.');
                  return;
                }
                resetPasswordMutation.mutate();
              }}
              isLoading={resetPasswordMutation.isPending}
            >
              Update Password
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter a new password for employee ID <strong className="text-slate-900">{selectedUser?.employeeId}</strong>.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password *
            </label>
            <Input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && deleteEmployeeMutation.mutate(deletingUser._id || deletingUser.id)}
        title="Delete Employee Account"
        description={`Are you sure you want to permanently delete account ${deletingUser?.employeeId} (${deletingUser?.name})?`}
        isLoading={deleteEmployeeMutation.isPending}
      />
    </div>
  );
};
