import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware-utils';
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
  type EmployeeInput,
} from '@/lib/employees';

type EmployeeRequestBody = {
  employeeid?: unknown;
  name?: unknown;
  pay?: unknown;
  email?: unknown;
  role?: unknown;
};

function parseEmployeeid(value: unknown): number | null {
  const id = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseEmployeeInput(body: EmployeeRequestBody): EmployeeInput | null {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const pay = typeof body.pay === 'number' ? body.pay : Number(body.pay);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = body.role === 'manager' || body.role === 'employee' ? body.role : null;

  if (!name || !email || !role || !Number.isFinite(pay) || pay < 0) {
    return null;
  }

  return { name, pay, email, role };
}

async function readBody(request: NextRequest): Promise<EmployeeRequestBody | null> {
  try {
    return (await request.json()) as EmployeeRequestBody;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['manager'], async () => {
    try {
      const employees = await getEmployees();
      return NextResponse.json(employees);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employees.' },
        { status: 500 }
      );
    }
  });
}

// POST/PATCH/DELETE are for managers only
export async function POST(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    const body = await readBody(request);
    const input = body ? parseEmployeeInput(body) : null;

    if (!input) {
      return NextResponse.json(
        { error: 'Name, pay, email, and role are required.' },
        { status: 400 }
      );
    }

    try {
      const employee = await createEmployee(input);
      return NextResponse.json(employee, { status: 201 });
    } catch (error) {
      console.error('Failed to create employee:', error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create employee.',
        },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    const body = await readBody(request);
    const employeeid = body ? parseEmployeeid(body.employeeid) : null;
    const input = body ? parseEmployeeInput(body) : null;

    if (!employeeid || !input) {
      return NextResponse.json(
        {
          error:
            'Employee ID, name, pay, email, and role are required.',
        },
        { status: 400 }
      );
    }

    try {
      const employee = await updateEmployee(employeeid, input);

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json(employee);
    } catch (error) {
      console.error('Failed to update employee:', error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update employee.',
        },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    const body = await readBody(request);
    const employeeid = body ? parseEmployeeid(body.employeeid) : null;

    if (!employeeid) {
      return NextResponse.json(
        { error: 'Employee ID is required.' },
        { status: 400 }
      );
    }

    try {
      const didDelete = await deleteEmployee(employeeid);

      if (!didDelete) {
        return NextResponse.json(
          { error: 'Employee not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Failed to delete employee:', error);
      return NextResponse.json(
        { error: 'Failed to delete employee.' },
        { status: 500 }
      );
    }
  });
}
