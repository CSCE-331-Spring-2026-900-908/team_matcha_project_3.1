import pool from '@/lib/db';

export type Employee = {
  employeeid: number;
  name: string;
  pay: number;
  job: string;
  ordernum: number;
};

export type EmployeeInput = {
  name: string;
  pay: number;
  job: string;
};

function mapEmployee(row: {
  employeeid: number;
  name: string;
  pay: string | number;
  job: string;
  ordernum: number | null;
}): Employee {
  return {
    employeeid: row.employeeid,
    name: row.name,
    pay: Number(row.pay),
    job: row.job,
    ordernum: row.ordernum ?? 0,
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT employeeid, name, pay, job, ordernum FROM employees ORDER BY employeeid ASC;'
    );
    return result.rows.map(mapEmployee);
  } finally {
    client.release();
  }
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO employees (name, pay, job, ordernum)
       VALUES ($1, $2, $3, 0)
       RETURNING employeeid, name, pay, job, ordernum;`,
      [input.name, input.pay, input.job]
    );
    return mapEmployee(result.rows[0]);
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
    const result = await client.query(
      `UPDATE employees
       SET name = $1, pay = $2, job = $3
       WHERE employeeid = $4
       RETURNING employeeid, name, pay, job, ordernum;`,
      [input.name, input.pay, input.job, employeeid]
    );
    return result.rows[0] ? mapEmployee(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function deleteEmployee(employeeid: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM employees WHERE employeeid = $1;',
      [employeeid]
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}
