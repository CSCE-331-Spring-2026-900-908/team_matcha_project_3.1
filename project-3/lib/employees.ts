import type { PoolClient } from 'pg';

import pool from '@/lib/db';

export type Employee = {
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

export type EmployeeInput = {
  name: string;
  pay: number;
  email: string;
  role: 'employee' | 'manager';
};

type LinkedUser = {
  userid: number;
  email: string;
  role: 'employee' | 'manager' | 'customer';
  google_id: string | null;
};

function mapEmployee(row: {
  employeeid: number;
  name: string;
  pay: string | number;
  job: string;
  ordernum: number | null;
  account_user_id: number | null;
  account_email: string | null;
  account_role: 'employee' | 'manager' | null;
  google_id: string | null;
}): Employee {
  return {
    employeeid: row.employeeid,
    name: row.name,
    pay: Number(row.pay),
    job: row.job,
    ordernum: row.ordernum ?? 0,
    account_user_id: row.account_user_id,
    account_email: row.account_email,
    account_role: row.account_role,
    has_google_login: Boolean(row.google_id),
  };
}

function normalizeEmployeeWriteError(error: unknown): Error {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    return new Error('That email or employee link is already in use.');
  }

  return error instanceof Error ? error : new Error('Employee write failed.');
}

async function createLinkedUser(
  client: PoolClient,
  input: {
    name: string;
    email: string;
    role: 'employee' | 'manager';
    employee_id: number;
  }
): Promise<LinkedUser> {
  const result = await client.query(
    `INSERT INTO app_users (google_id, email, name, role, employee_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role, google_id`,
    [null, input.email, input.name, input.role, input.employee_id]
  );

  return {
    userid: result.rows[0].id,
    email: result.rows[0].email,
    role: result.rows[0].role,
    google_id: result.rows[0].google_id,
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         e.employeeid,
         e.name,
         e.pay,
         e.job,
         e.ordernum,
         u.id AS account_user_id,
         u.email AS account_email,
         u.role AS account_role,
         u.google_id
       FROM employees e
       LEFT JOIN app_users u
         ON u.employee_id = e.employeeid
       ORDER BY e.employeeid ASC;`
    );
    return result.rows.map(mapEmployee);
  } finally {
    client.release();
  }
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const employeeResult = await client.query(
      `INSERT INTO employees (name, pay, job, ordernum)
       VALUES ($1, $2, $3, 0)
       RETURNING employeeid, name, pay, job, ordernum;`,
      [input.name, input.pay, 'Barista']
    );

    const employee = employeeResult.rows[0];

    const user = await createLinkedUser(
      client,
      {
        name: input.name,
        email: input.email,
        role: input.role,
        employee_id: employee.employeeid,
      }
    );

    await client.query('COMMIT');

    return mapEmployee({
      ...employee,
      account_user_id: user.userid,
      account_email: user.email,
      account_role: user.role === 'customer' ? null : user.role,
      google_id: user.google_id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw normalizeEmployeeWriteError(error);
  } finally {
    client.release();
  }
}

export async function updateEmployee(
  employeeid: number,
  input: EmployeeInput
): Promise<Employee | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const employeeResult = await client.query(
      `UPDATE employees
       SET name = $1, pay = $2, job = 'Barista'
       WHERE employeeid = $3
       RETURNING employeeid, name, pay, job, ordernum;`,
      [input.name, input.pay, employeeid]
    );

    if (!employeeResult.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    const userResult = await client.query(
      `UPDATE app_users
       SET name = $1, email = $2, role = $3
       WHERE employee_id = $4
       RETURNING id AS account_user_id, email AS account_email, role AS account_role, google_id`,
      [input.name, input.email, input.role, employeeid]
    );

    if (!userResult.rows[0]) {
      await client.query('ROLLBACK');
      throw new Error('Linked app user not found.');
    }

    await client.query('COMMIT');

    return mapEmployee({
      ...employeeResult.rows[0],
      ...userResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw normalizeEmployeeWriteError(error);
  } finally {
    client.release();
  }
}

export async function deleteEmployee(employeeid: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM app_users WHERE employee_id = $1;', [
      employeeid,
    ]);
    const result = await client.query('DELETE FROM employees WHERE employeeid = $1;', [
      employeeid,
    ]);
    await client.query('COMMIT');
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
