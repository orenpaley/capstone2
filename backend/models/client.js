const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

class Client {
  static async save(userId, data) {
    const userCheck = await db.query(`select id FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!userCheck.rows[0]) {
      throw NotFoundError(`user not found - id:${id}`);
    }
    const clientQuery = await db.query(
      `INSERT INTO clients (user_id, name, address, email)
          VALUES($1,$2,$3,$4)
          RETURNING (id, name, address, email, created_at)`,
      [userId, data.name, data.address, data.email]
    );
    return clientQuery.rows[0];
  }

  static async findAll(userId) {
    const userCheck = await db.query(`select id FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!userCheck.rows[0]) {
      throw NotFoundError(`user not found - id:${userId}`);
    }

    const clientsQuery = await db.query(
      `SELECT id, name, address, email, created_at AS "createdAt" FROM clients
        WHERE user_id = $1`,
      [userId]
    );
    return clientsQuery.rows;
  }

  static async open(userId, id) {
    const userCheck = await db.query(`select id FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!userCheck.rows[0]) {
      throw NotFoundError(`user not found - id:${id}`);
    }
    const clientQuery = await db.query(
      `SELECT name, address, email FROM clients
        WHERE user_id = $1 AND id = $2`,
      [userId, id]
    );
    return clientQuery.rows[0];
  }

  static async update(userId, id, data) {
    const formattedSql = sqlForPartialUpdate(data, {
      userId: "user_id",
    });
    const userIdx = "$" + (formattedSql.values.length + 1);
    const keyIdx = "$" + (formattedSql.values.length + 2);

    const querySql = `UPDATE clients
                    SET ${formattedSql.setCols} 
                    WHERE user_id = ${userIdx} AND id = ${keyIdx}
                    RETURNING user_id AS "userId", name, email, address`;
    const result = await db.query(querySql, [
      ...formattedSql.values,
      userId,
      id,
    ]);
    const client = result.rows[0];

    if (!client) throw new NotFoundError(`No client: ${id}`);

    return client;
  }

  static async remove(id, clientId) {
    const delQuery = await db.query(
      `DELETE from clients WHERE user_id = $1 AND id = $2 RETURNING name`,
      [id, clientId]
    );
    return `deleted Client: ${delQuery.rows[0].name}`;
  }
}

module.exports = Client;
