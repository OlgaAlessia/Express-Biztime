// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testIndustry;

beforeEach(async () => {
    const resultCom = await db.query(`INSERT INTO companies (code, name) VALUES ('merge', 'Merge Event Solutions') RETURNING code, name, description`);
    testCompany = resultCom.rows[0];
    
    const resultIndustryE = await db.query(`INSERT INTO industries (code, industry) VALUES ('entm', 'Entertainment') RETURNING code, industry`);
    testIndustry = resultIndustryE.rows[0];
    await db.query(`INSERT INTO companies_industries (company_code, industry_code) VALUES ('merge', 'entm')`);
})

afterEach(async () => {
    await db.query(`DELETE FROM companies_industries`);
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM industries`);
})


describe("GET /industries", () => {
    test("Get a list with one company", async () => {
        const res = await request(app).get('/industries');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ industries: [ testIndustry ] });
    })

})

describe("GET /industries/:code", () => {
    test("Get the company with the code given", async () => {
        const res = await request(app).get(`/industries/${testIndustry.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ industry: { code: testIndustry.code, industry: testIndustry.industry, companies: [ testCompany.name ]} });
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).get(`/industries/cactus`);
        expect(res.statusCode).toBe(404);
    })
})


describe("POST /industries/", () => {
    test("Creating a industry", async () => {
        const res = await request(app).post('/industries').send({ code: 'py', industry: 'Party' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ industry: { code: 'py', industry: 'Party' } });
    })
    test("Responds with 404 no code given", async () => {
        const res = await request(app).post(`/industries`).send({ industry: 'Music' });
        expect(res.statusCode).toBe(404);
    })
    test("Responds with 404 no industry given", async () => {
        const res = await request(app).post(`/industries`).send({ code: 'mus' });
        expect(res.statusCode).toBe(404);
    })
})



describe("PUT /industries/:code", () => {
    test("Updates the company with the code given", async () => {
        const res = await request(app).put(`/industries/${testIndustry.code}`).send({ industry: 'Entrattenimento' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ industry: { code: testIndustry.code, industry: 'Entrattenimento'} });
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).put(`/industries/en`).send({ industry: 'Entrattenimento' });
        expect(res.statusCode).toBe(404);
    })
})


describe("POST /industries/associating", () => {
    test("Creating an association companies_industries", async () => {
        await db.query(`DELETE FROM companies_industries`);
        const res = await request(app).post('/industries/associating').send({ code_C: testCompany.code, code_I: testIndustry.code });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ companies_industries: { company_code: 'merge', industry_code: 'entm' } });
    })
    test("Responds with 404 no company code given", async () => {
        const res = await request(app).post(`/industries/associating`).send({ code_C: 'merge' });
        expect(res.statusCode).toBe(404);
    })
    test("Responds with 404 no industry given", async () => {
        const res = await request(app).post(`/industries/associating`).send({ code_I: 'entm' });
        expect(res.statusCode).toBe(404);
    })
})

afterAll(async () => {
    await db.end()
})
