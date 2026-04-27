'use client';

import { FormEvent, useEffect, useState } from 'react';
import { authFetch } from '@/lib/fetch-utils';

type Employee = {
  employeeid: number;
  name: string;
  pay: number;
  job: string;
  ordernum: number;
  account_user_id: number | null;
  account_email: string | null;
  account_role: 'employee' | 'manager' | null;
  has_google_login: boolean;
};

type EmployeeForm = {
  name: string;
  pay: string;
  email: string;
};

const emptyForm: EmployeeForm = {
  name: '',
  pay: '',
  email: '',
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployees() {
      try {
        const response = await authFetch('/api/employees');

        if (!response.ok) {
          throw new Error('Failed to load employees.');
        }

        const data: Employee[] = await response.json();

        if (isMounted) {
          setEmployees(data);
          setError(null);
        }
      } catch (fetchError) {
        if (isMounted) {
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to load employees.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateForm(field: keyof EmployeeForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function startEdit(employee: Employee) {
    setEditingEmployee(employee);
    setForm({
      name: employee.name,
      pay: String(employee.pay),
      email: employee.account_email ?? '',
    });
    setError(null);
    setNotice(null);
    setIsModalOpen(true);
  }

  function resetForm() {
    setEditingEmployee(null);
    setForm(emptyForm);
    setIsModalOpen(false);
  }

  function validateForm() {
    const name = form.name.trim();
    const pay = Number(form.pay);
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !Number.isFinite(pay) || pay < 0) {
      return null;
    }

    return {
      name,
      pay,
      email,
      role: editingEmployee?.account_role ?? 'employee',
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = validateForm();

    if (!input) {
      setError('Enter a name, pay, and email.');
      setNotice(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/employees', {
        method: editingEmployee ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          editingEmployee
            ? { employeeid: editingEmployee.employeeid, ...input }
            : input
        ),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save employee.');
      }

      const savedEmployee = data as Employee;

      if (editingEmployee) {
        setEmployees((currentEmployees) =>
          currentEmployees.map((employee) =>
            employee.employeeid === savedEmployee.employeeid
              ? savedEmployee
              : employee
          )
        );
        setNotice('Employee updated.');
      } else {
        setEmployees((currentEmployees) => [
          ...currentEmployees,
          savedEmployee,
        ]);
        setNotice('Employee added.');
      }

      resetForm();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save employee.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  function startCreate() {
    setEditingEmployee(null);
    setForm(emptyForm);
    setError(null);
    setNotice(null);
    setIsModalOpen(true);
  }

  async function handleDelete(employee: Employee) {
    const confirmed = window.confirm(`Delete ${employee.name}?`);

    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/employees', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeid: employee.employeeid }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete employee.');
      }

      setEmployees((currentEmployees) =>
        currentEmployees.filter(
          (currentEmployee) =>
            currentEmployee.employeeid !== employee.employeeid
        )
      );

      if (editingEmployee?.employeeid === employee.employeeid) {
        resetForm();
      }

      setNotice('Employee deleted.');
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete employee.';
      setError(message);
    }
  }

  return (
    <section className="space-y-8 animate-in fade-in duration-500">
      {notice && <p className="text-green-600 font-bold">{notice}</p>}
      {error && <p className="text-red-600 font-bold">{error}</p>}

      <div className="bg-white rounded-[32px] shadow-xl border border-[#eadfce] overflow-hidden">
        <div className="p-8 border-b border-[#f0e6d8] flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#2f241d]">Current Employees</h2>
            <p className="text-sm text-[#8a6240] mt-1">
              Edit from the table without jumping to a top form.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#8a6240] bg-[#f8f1e7] px-4 py-1 rounded-full">
              {employees.length} Employees
            </span>
            <button
              type="button"
              onClick={startCreate}
              className="px-6 py-3 bg-[#2f7a5f] text-white rounded-xl font-bold hover:bg-[#25614b] transition-all"
            >
              Add Employee
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fcf8f2] text-[#8a6240] text-xs font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Employee</th>
                <th className="px-8 py-4">Login</th>
                <th className="px-8 py-4">Pay</th>
                <th className="px-8 py-4">Orders</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6d8]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6f5848]">
                    Loading employees...
                  </td>
                </tr>
              ) : null}

              {!isLoading && employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6f5848]">
                    No employees found.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? employees.map((employee) => (
                    <tr
                      key={employee.employeeid}
                      className="hover:bg-[#fdfaf6] transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="font-bold text-[#2f241d]">
                          {employee.name}
                        </div>
                        <div className="text-xs text-[#8a6240]">
                          #{employee.employeeid} • {employee.job}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-sm text-[#2f241d]">
                          {employee.account_email ?? 'No linked login'}
                        </div>
                        <div className="text-xs text-[#8a6240]">
                          {employee.has_google_login
                            ? 'Google account attached'
                            : 'Waiting for first sign-in'}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-[#6f5848]">
                        {currencyFormatter.format(employee.pay)}
                      </td>
                      <td className="px-8 py-5 text-sm text-[#6f5848]">
                        {employee.ordernum}
                      </td>
                      <td className="px-8 py-5 text-right space-x-2">
                        <button
                          onClick={() => startEdit(employee)}
                          className="p-2 text-[#2f7a5f] hover:bg-[#ecf4f0] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white rounded-[32px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#2f241d]">
                {editingEmployee ? 'Edit Employee' : 'Create New Employee'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-[#8a6240] hover:text-[#2f241d]"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#8a6240] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#eadfce] outline-none focus:ring-2 focus:ring-[#2f7a5f]"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#8a6240] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#eadfce] outline-none focus:ring-2 focus:ring-[#2f7a5f]"
                    placeholder="staff@matcha.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#8a6240] mb-1">Pay</label>
                  <input
                    type="number"
                    value={form.pay}
                    onChange={(e) => updateForm('pay', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#eadfce] outline-none focus:ring-2 focus:ring-[#2f7a5f]"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
                {editingEmployee ? (
                  <div className="rounded-xl bg-[#f8f1e7] px-4 py-3 text-sm text-[#6f5848]">
                    Order count: <span className="font-bold">{editingEmployee.ordernum}</span>
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-[#2f7a5f] text-white rounded-xl font-bold hover:bg-[#25614b] transition-all disabled:opacity-50"
                >
                  {isSaving
                    ? 'Saving...'
                    : editingEmployee
                      ? 'Update Employee'
                      : 'Create Employee'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-3 bg-gray-100 text-[#6f5848] rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
