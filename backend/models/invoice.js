"use strict";

const moment = require("moment");

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
// const { default: LobsterApi } = require("../../lobster_invoice/src/API/api");

class Invoice {
  static async save(
    userId,
    {
      clientId,
      code,
      email,
      firstName,
      lastName,
      address,
      cityStateZip,
      logo = "https://www.pixfiniti.com/wp-content/uploads/2020/06/small_house_logo_template_3.png",
      clientName,
      clientAddress,
      clientCityStateZip,
      clientEmail,
      date,
      dueDate,
      items,
      submittedAt,
      terms,
      notes,
      taxRate,
      total,
      currency,
      status,
    }
  ) {
    const duplicateCheck = await db.query(
      `SELECT code
           FROM invoices
           WHERE code = $1 AND user_id = $2`,
      [code, +userId]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate invoice code: ${code}`);
    }

    let result = await db.query(
      `insert INTO invoices
        (user_id,
          client_id,
          code,
          email,
          first_name,
          last_name,
          address, 
          city_state_zip,
          logo, 
          client_name,
          client_address, 
          client_city_state_zip,
          client_email, 
          date, 
          due_date,
          submitted_at, 
          terms, 
          notes, 
          tax_rate, 
          total, 
          currency, 
          status)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING user_id AS "userId", client_id AS "clientId", code, email, first_name AS "firstName",
        last_name AS "lastName", address, city_state_zip AS "cityStateZip", logo, client_name AS "clientName", client_address AS "clientAddress", 
        client_city_state_zip AS "clientCityStateZip",
        client_email AS "clientEmail", created_at AS "createdAt", date, due_date as "dueDate", payment_terms AS "Input", 
        submitted_at AS "submittedAt", terms, notes, tax_rate AS "taxRate", total, currency, status`,

      [
        +userId,
        clientId,
        code,
        email,
        firstName,
        lastName,
        address,
        cityStateZip,
        logo,
        clientName,
        clientAddress,
        clientCityStateZip,
        clientEmail,
        date,
        dueDate,
        submittedAt,
        terms,
        notes,
        taxRate,
        total,
        currency,
        status,
      ]
    );
    const invoice = result.rows[0];

    const newItems = [];
    for (let item of items) {
      const itemQuery = `INSERT INTO items
    (userId, invoiceId, index, description, rate, quantity)
     VALUES($1,$2,$3,$4,$5,$6)
       `;
      const itemRes = await db.query(itemQuery, [
        +userId,
        id,
        indexCount,
        item.description,
        +item.rate,
        +item.quantity,
      ]);
      newItems.push(itemRes.rows[0]);
      indexCount++;
    }

    invoice.items = newItems;

    return invoice;
  }

  /** Given an invoice code and user_id, return an invoice.
   *
   * Returns { invoice }

   * Throws NotFoundError if invoice not found.
   **/

  static async open(userId, code) {
    const invoiceRes = await db.query(
      `SELECT id, user_id AS "userId", client_id AS "clientId", code,
              email, first_name AS "firstName", last_name AS "lastName",
              address, city_state_zip AS "cityStateZip", logo, client_name AS "clientName", client_address AS "clientAddress", 
              client_city_state_zip AS "clientCityStateZip", client_email AS "clientEmail", created_at AS "createdAt", date, 
              due_date as "dueDate", submitted_at AS "submittedAt", 
              terms, notes, tax_rate AS "taxRate", total, currency, status
              FROM invoices
      WHERE user_id = $1 AND code = $2`,
      [+userId, code]
    );

    const invoice = invoiceRes.rows[0];

    const itemQuery = `SELECT index,  user_id AS "userId", invoice_id AS "invoiceId",
                              description, rate, quantity
                        FROM items
                        WHERE user_id = $1 AND invoice_id = $2;`;
    const items = await db.query(itemQuery, [userId, invoice.id]);
    console.log("items? -> ", items.rows);
    invoice.items = items.rows || [];
    console.log("invoice on open --> ", invoice);
    console.log("invoice date", moment(invoice.date).format("YYYY-MM-DD"));

    invoice.date = moment(invoice.date).format("YYYY-MM-DD");
    invoice.dueDate = moment(invoice.dueDate).format("YYYY-MM-DD");

    if (!invoice) throw new NotFoundError(`No invoice for user found: ${code}`);

    return invoice;
  }

  /** Given a  user_id, return all invoices for that user .
   *   Given no user_id returns all invoices (admin only permissions should be enabled)
   *
   * Returns { first_name AS "firstName",
                last_name AS "lastName",
                client_name AS "clientName",
                created_at AS "createdAt",
                due_date AS "dueDate",
                total, 
                status}

   * Throws NotFoundError if no invoices found.
   **/

  static async findAll(userId = null) {
    if (!userId) {
      const invoicesRes = await db.query(
        `SELECT code,
                first_name AS "firstName",
                last_name AS "lastName",
                client_name AS "clientName",
                created_at AS "createdAt",
                due_date AS "dueDate",
                total, 
                status
             FROM invoices
             `
      );
    }
    const invoicesRes = await db.query(
      `SELECT code,
                first_name AS "firstName",
                last_name AS "lastName",
                client_name AS "clientName",
                created_at AS "createdAt",
                due_date AS "dueDate",
                total, 
                status
             FROM invoices
             WHERE user_id = $1`,
      [userId]
    );

    const invoices = invoicesRes.rows;

    if (!invoices) throw new NotFoundError(`No invoices found`);

    return invoices;
  }

  /** Given an invoice code and user_id, modify data about user.
   *
   * Returns { code, first_name, last_name, address,
   *           client_name, client_email, created_at}

   * Throws NotFoundError if user not found.
   **/

  static async update(userId, code, data) {
    const currItems = data.items;

    delete data.items;

    const formattedSql = sqlForPartialUpdate(data, {
      userId: "user_id",
      clientId: "client_id",
      firstName: "first_name",
      lastName: "last_name",
      cityStateZip: "city_state_zip",
      clientName: "client_name",
      clientAddress: "client_address",
      clientCityStateZip: "client_city_state_zip",
      clientEmail: "client_email",
      createdAt: "created_at",
      dueDate: "due_date",
      submittedAt: "submitted_at",
      taxRate: "tax_rate",
    });
    const userIdx = "$" + (formattedSql.values.length + 1);
    const codeIdx = "$" + (formattedSql.values.length + 2);

    console.log("deleting....");

    await db.query(`DELETE from items WHERE invoice_id = $1 AND user_id = $2`, [
      data.id,
      data.userId,
    ]);
    console.log("did we delete?");

    if (currItems) {
      console.log("CURR ITEMS CURR ITEMS", currItems);
      let indexCount = 1;
      for (let item of currItems) {
        console.log("i am item", item);
        const itemQuery = `INSERT INTO items
                             (user_id, invoice_id, index, description, rate, quantity)
                              VALUES($1,$2,$3,$4,$5,$6)`;
        await db.query(itemQuery, [
          +data.userId,
          +data.id,
          +indexCount,
          item.description,
          +item.rate,
          +item.quantity,
        ]);
        indexCount++;
      }
    }

    const querySql = `UPDATE invoices
                      SET ${formattedSql.setCols} 
                      WHERE user_id = ${userIdx} AND code = ${codeIdx}
                      RETURNING id, user_id AS "userId", code, first_name AS "firstName", last_name AS "lastName", address, city_state_zip AS "cityStateZip", 
                      client_name AS "clientName", client_address AS "clientAddress", client_city_state_zip AS "clientCityStateZip",
                      client_email as "clientEmail", created_at as "createdAt", date, due_date AS "dueDate", status, total`;
    const result = await db.query(querySql, [
      ...formattedSql.values,
      +userId,
      code,
    ]);
    const invoice = result.rows[0];
    console.log("invoice data pre item processing ->", invoice);

    if (!invoice) throw new NotFoundError(`No user: ${userId}`);

    invoice.items = currItems || [];
    // filteredInv = invoice.filter((row) => row != "items");
    // console.log("returning invoice without items? -> ", filteredInv);
    return invoice;
  }

  static async remove(userId, invoiceCode) {
    if (userId && invoiceCode) {
      await db.query(`DELETE from invoices WHERE user_id = $1 AND code = $2`, [
        +userId,
        invoiceCode,
      ]);
    }
  }

  static async addItems(items, userId, invoiceId) {
    if (items) {
      const newItems = [];
      for (let item in items) {
        let indexCount = 0;
        const itemQuery = `INSERT INTO items (index, user_id, invoice_id, description, rate, quantity)
                            VALUES ($1,$2,$3,$4,$5,%6)
                            RETURNING index, user_id AS "userId", invoice_id AS "invoiceId", description, rate, quantity`;
        const itemRes = await db.query(itemQuery, [
          indexCount + 1,
          +userId,
          +invoiceId,
          item.description,
          +item.rate,
          +item.quantity,
        ]);
        newItems.push(itemRes.rows[0]);
        indexCount++;
      }
      return newItems;
    }
    return [];
  }

  // static async deleteItem(id) {
  //   await db.query(`DELETE FROM items WHERE id = $1`, [id]);
  //   return `deleted item`;
  // }

  static async getItems(userId, invoiceId) {
    const itemQuery = `SELECT (user_id AS "userId", invoice_id AS "invoiceId",
                              description, rate, quantity)
                        FROM items
                        Where user_id = $1 AND invoice_id = $2`;

    const result = await db.query(itemQuery, [userId, invoiceId]);
    const itemsRes = result.rows;
    return itemsRes;
  }
  static async patchItems(userId, invoiceId, items) {
    const itemQuery = `SELECT (user_id AS "userId", invoice_id AS "invoiceId",
                              description, rate, quantity)
                        FROM items
                        Where user_id = $1 AND invoice_id = $2`;

    const result = await db.query(itemQuery, [userId, invoiceId]);
    const itemsRes = result.rows;
    return itemsRes;
  }
}

module.exports = Invoice;
