// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testIndustryE;
let testIndustryM;

beforeEach(async () => {
    const resultCom = await db.query(`INSERT INTO companies (code, name) VALUES ('merge', 'Merge Event Solutions') RETURNING code, name, description`);
    testCompany = resultCom.rows[0];
    
    const resultindustryE = await db.query(`INSERT INTO industries (code, industry) VALUES ('entm', 'Entertainment') RETURNING code, industry`);
    testIndustryE = resultindustryE.rows[0];
    const resultindustryM = await db.query(`INSERT INTO industries (code, industry) VALUES ('mus', 'Music') RETURNING code, industry`);
    testIndustryM = resultindustryM.rows[0];
    await db.query(`INSERT INTO companies_industries (company_code, industry_code) VALUES ('merge', 'entm'), ('merge', 'mus')`);
})

afterEach(async () => {
    await db.query(`DELETE FROM companies_industries`);
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM industries`);
})


describe("GET /companies", () => {
    test("Get a list with one company", async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [{code: testCompany.code, name: testCompany.name}] });
    })

})

describe("GET /companies/:code", () => {
    test("Get the company with the code given", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: { code: testCompany.code, name: testCompany.name, description: testCompany.description, industries: [ testIndustryE.industry, testIndustryM.industry ]} });
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).get(`/companies/pixar`);
        expect(res.statusCode).toBe(404);
    })
})


describe("POST /companies/", () => {
    test("Creating a company", async () => {
        //const res = await request(app).post('/companies').send({ code: 'pixar', name: 'Pixar Animation Studios' });
        const res = await request(app).post('/companies').send({ name: 'Pixar Animation Studios' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ 
            company: { code: 'pixar-animation-studios', name: 'Pixar Animation Studios', description: null }
        });
    })
    //test("Responds with 404 no code given", async () => {
    //    const res = await request(app).post(`/companies`).send({ name: 'Google' });
    //    expect(res.statusCode).toBe(404);
    //})
    test("Responds with 404 no name given", async () => {
        const res = await request(app).post(`/companies`).send({ code: 'google' });
        expect(res.statusCode).toBe(404);
    })
})


describe("PUT /companies/:code", () => {
    test("Updates the company with the code given", async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`).send({ name: 'Merge Event', description: 'have fun' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ 
            company: {code: testCompany.code, name: "Merge Event", description: 'have fun'}
        });
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).put(`/companies/pixar`).send({ name: 'Merge Event', description: 'have fun' });
        expect(res.statusCode).toBe(404);
    })
})


describe("DELETE /companies/:code", () => {
    test("Delete the company with code given", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: "deleted" });
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).delete(`/companies/pixar`);
        expect(res.statusCode).toBe(404);
    })
})


afterAll(async () => {
    await db.end()
})
