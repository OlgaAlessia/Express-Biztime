process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoice;

beforeEach(async () => {
    
    const resultCom = await db.query(`INSERT INTO companies (code, name) VALUES ('merge', 'Merge Event Solutions') RETURNING code, name, description`);
    testCompany = resultCom.rows[0];

    const resultInv = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('merge', 500, true, '2023-01-01') RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testInvoice = resultInv.rows[0];
})

afterEach(async () => {
    await db.query(`DELETE FROM invoices`);
    await db.query(`DELETE FROM companies`);
})


describe("GET /invoices", () => {
    test("Get a list with one invoices", async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoices: [ {id: testInvoice.id, comp_code: testInvoice.comp_code}] });
    })
})


describe("GET /invoices/:id", () => {
    test("Get the invoices with the id given", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.invoice).toHaveProperty("id");
        expect(res.body.invoice).toHaveProperty("amt");
        expect(res.body.invoice.amt).toEqual(500);
        expect(res.body.invoice).toHaveProperty("paid");
        expect(res.body.invoice.paid).toEqual(true);
        expect(res.body.invoice).toHaveProperty("add_date");
        expect(res.body.invoice.company.code).toEqual("merge");
        expect(res.body.invoice.company.name).toEqual("Merge Event Solutions");
        expect(res.body.invoice.company).toHaveProperty("description");
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).get(`/invoices/40`);
        expect(res.statusCode).toBe(404);
    })
})


describe("POST /invoices/", () => {
    test("Creating a invoices", async () => {
        const resp = await request(app).post('/invoices').send({ comp_code: 'merge', amt: 400 });
        expect(resp.statusCode).toBe(201);
        expect(resp.body.invoice).toHaveProperty("id");
        expect(resp.body.invoice).toHaveProperty("amt");
        expect(resp.body.invoice.amt).toEqual(400);
        expect(resp.body.invoice).toHaveProperty("comp_code");
        expect(resp.body.invoice.comp_code).toEqual('merge');
        expect(resp.body.invoice).toHaveProperty("paid");
        expect(resp.body.invoice.paid).toEqual(false);
        expect(resp.body.invoice).toHaveProperty("add_date");
        expect(resp.body.invoice).toHaveProperty("paid_date");
    })
    test("Responds with 404 no comp_code given", async () => {
        const res = await request(app).post(`/invoices`).send({ comp_code: 'merge' });
        expect(res.statusCode).toBe(404);
    })
    test("Responds with 404 no amt given", async () => {
        const res = await request(app).post(`/invoices`).send({ amt: 700 });
        expect(res.statusCode).toBe(404);
    })
})


describe("PUT /invoices/:id", () => {
    test("Updates the invoices with the id given", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 150, paid: true });
        expect(res.statusCode).toBe(200);
        expect(res.body.invoice).toHaveProperty("amt");
        expect(res.body.invoice.amt).toEqual(150);
        expect(res.body.invoice).toHaveProperty("paid");
        expect(res.body.invoice.paid).toEqual(true);
        expect(res.body.invoice).toHaveProperty("paid_date");
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).put(`/invoices/40`).send({ amt: 150, paid: true });
        expect(res.statusCode).toBe(404);
    })
})


describe("DELETE /invoices/:id", () => {
    test("Delete the invoices with code given", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: "deleted" });
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).delete(`/invoices/40`);
        expect(res.statusCode).toBe(404);
    })
})

afterAll(async () => {
    await db.end()
})
