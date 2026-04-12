'use client';

import { FormEvent, useEffect, useState } from 'react';

type Employee = {
  employeeid: number;
  name: string;
  pay: number;
  job: string;
  ordernum: number;
};

type EmployeeForm = {
  name: string;
  pay: string;
  job: string;
};

const emptyForm: EmployeeForm = {
  name: '',
  pay: '',
  job: '',
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployees() {
      try {
        const response = await fetch('/api/employees');

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
      job: employee.job,
    });
    setError(null);
    setNotice(null);
  }

  function resetForm() {
    setEditingEmployee(null);
    setForm(emptyForm);
  }

  function validateForm() {
    const name = form.name.trim();
    const job = form.job.trim();
    const pay = Number(form.pay);

    if (!name || !job || !Number.isFinite(pay) || pay < 0) {
      return null;
    }

    return { name, job, pay };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = validateForm();

    if (!input) {
      setError('Enter a name, job, and non-negative pay value.');
      setNotice(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/employees', {
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

  async function handleDelete(employee: Employee) {
    const confirmed = window.confirm(`Delete ${employee.name}?`);

    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/employees', {
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
    <section className="rounded-[32px] border border-[#cfd9ca] bg-[#f7faf5] p-6 shadow-[0_18px_50px_rgba(31,37,32,0.06)] sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="border-b border-[#dbe4d6] pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#667463]">
            Employees
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#223020] sm:text-4xl">
            Employee management
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-[28px] border border-[#d9e3d5] bg-white p-5 lg:grid-cols-[1fr_0.7fr_1fr_auto]"
        >
          <label className="flex flex-col gap-2 text-sm font-semibold text-[#556253]">
            Name
            <input
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              className="rounded-[12px] border border-[#cfd9ca] px-4 py-3 text-base font-medium text-[#223020] outline-none focus:border-[#6a8e67] focus:ring-4 focus:ring-[#dbe7d7]"
              placeholder="Employee name"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#556253]">
            Pay
            <input
              value={form.pay}
              onChange={(event) => updateForm('pay', event.target.value)}
              className="rounded-[12px] border border-[#cfd9ca] px-4 py-3 text-base font-medium text-[#223020] outline-none focus:border-[#6a8e67] focus:ring-4 focus:ring-[#dbe7d7]"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#556253]">
            Job
            <input
              value={form.job}
              onChange={(event) => updateForm('job', event.target.value)}
              className="rounded-[12px] border border-[#cfd9ca] px-4 py-3 text-base font-medium text-[#223020] outline-none focus:border-[#6a8e67] focus:ring-4 focus:ring-[#dbe7d7]"
              placeholder="Role"
            />
          </label>

          <div className="flex flex-col justify-end gap-2 sm:flex-row lg:flex-col">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-[12px] border border-[#5f855c] bg-[#6a8e67] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#597b56] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? 'Saving'
                : editingEmployee
                  ? 'Update'
                  : 'Add'}
            </button>
            {editingEmployee ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-[12px] border border-[#cfd9ca] bg-[#f7faf5] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#556253] transition hover:bg-[#eef5eb]"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        {editingEmployee ? (
          <p className="text-sm font-medium text-[#556253]">
            Editing employee #{editingEmployee.employeeid}. Order count{' '}
            {editingEmployee.ordernum} stays read-only.
          </p>
        ) : null}

        {error ? (
          <div className="rounded-[18px] border border-[#e7b8b2] bg-[#fff1ef] px-5 py-4 text-sm font-semibold text-[#97463c]">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-[18px] border border-[#cfe3cc] bg-[#eef8ec] px-5 py-4 text-sm font-semibold text-[#2f6d2a]">
            {notice}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[28px] border border-[#d9e3d5] bg-white">
          <div className="hidden grid-cols-[0.5fr_1.4fr_0.8fr_1fr_0.8fr_1fr] gap-4 border-b border-[#dfe8da] bg-[#edf4ea] px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[#6c7968] lg:grid">
            <span>ID</span>
            <span>Name</span>
            <span>Pay</span>
            <span>Job</span>
            <span>Orders</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm font-semibold text-[#6c7968]">
              Loading employees...
            </div>
          ) : null}

          {!isLoading && employees.length === 0 && !error ? (
            <div className="px-6 py-12 text-center text-sm font-semibold text-[#6c7968]">
              No employees found.
            </div>
          ) : null}

          {!isLoading && employees.length > 0 ? (
            <div className="divide-y divide-[#ebf0e8]">
              {employees.map((employee) => (
                <article
                  key={employee.employeeid}
                  className="grid gap-4 px-6 py-5 lg:grid-cols-[0.5fr_1.4fr_0.8fr_1fr_0.8fr_1fr] lg:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      ID
                    </p>
                    <p className="text-sm font-semibold text-[#223020]">
                      {employee.employeeid}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Name
                    </p>
                    <p className="text-base font-semibold text-[#223020]">
                      {employee.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Pay
                    </p>
                    <p className="text-sm font-medium text-[#586756]">
                      {currencyFormatter.format(employee.pay)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Job
                    </p>
                    <p className="text-sm font-medium text-[#586756]">
                      {employee.job}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Orders
                    </p>
                    <p className="text-sm font-medium text-[#586756]">
                      {employee.ordernum}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(employee)}
                      className="rounded-[12px] border border-[#6a8e67] bg-[#e6f1e1] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#33452f] transition hover:bg-[#dcebd6]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(employee)}
                      className="rounded-[12px] border border-[#d9a7a0] bg-[#fff1ef] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#97463c] transition hover:bg-[#ffe5e0]"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
