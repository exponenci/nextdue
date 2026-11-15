import type postgres from "postgres";
import { sql } from "./client";

export async function withTenant<T>(
  userId: string,
  householdId: string,
  work: (transaction: postgres.TransactionSql) => Promise<T>
): Promise<T> {
  return sql.begin(async (transaction) => {
    await transaction`select set_config('app.current_user_id', ${userId}, true)`;
    await transaction`select set_config('app.current_household_id', ${householdId}, true)`;
    return work(transaction);
  }) as Promise<T>;
}
