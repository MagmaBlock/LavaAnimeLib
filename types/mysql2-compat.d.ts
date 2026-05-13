import "mysql2/promise";

declare module "mysql2/promise" {
  interface Pool {
    query(sql: string): Promise<[any, any]>;
    query(sql: string, values: any): Promise<[any, any]>;
    execute(sql: string): Promise<[any, any]>;
    execute(sql: string, values: any): Promise<[any, any]>;
  }
}
