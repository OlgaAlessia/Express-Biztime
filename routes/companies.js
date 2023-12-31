const express = require("express");
const slugify = require('slugify');
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

/**
 * Returns list of companies, like `{companies: [{code, name}, ...]}`
 */
router.get('/', async (req, res, next) => {
    try {
        const myQuery = await db.query(`SELECT code, name FROM companies`);
        return res.json({ companies: myQuery.rows });
    } catch (e) {
        return next(e);
    }
});


/**
 * Return obj of company: `{company: {code, name, description, industries: [name] }}`
 * If the company given cannot be found, this should return a 404 status response.
 */
router.get('/:code', async (req, res, next) => {
    try {
        const myQuery = await db.query(`
        SELECT c.code, c.name, c.description, i.industry
        FROM companies AS c
        LEFT JOIN companies_industries AS c_i ON c.code = c_i.company_code
        LEFT JOIN industries AS i ON c_i.industry_code = i.code
        WHERE c.code = $1`, [req.params.code]);

        if (myQuery.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of '${req.params.code}`, 404);
        }
        const { code, name, description } = myQuery.rows[0]; //this part is the same
        const industries = myQuery.rows.map(r => r.industry);
        return res.json({ company: {code, name, description, industries }});
    } catch (e) {
        return next(e);
    }
});


/**
 * Adds a company. Needs to be given JSON like: `{code, name, description}`
 * Returns obj of new company:  `{company: {code, name, description}}` 
 * change the route so that they don’t provide a code directly, but you make this by using slugify() on the given name
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (name == null || name == "") {
            throw new ExpressError('Name is required', 404);
        }
        const code = slugify(name, {
            lower: true,      // convert to lower case, defaults to `false`
            strict: true     // strip special characters except replacement, defaults to `false`
        });
        if (description == "") description = null;
        const myQuery = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({ company: myQuery.rows[0] })
    } catch (e) {
        return next(e);
    }
})


/**
 * Edit existing company. Should return 404 if company cannot be found.
 * Needs to be given JSON like: `{name, description}` Returns update company object: `{company: {code, name, description}}`
 */
router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        if (name == null || description == null) {
            throw new ExpressError('name and description are required', 404);
        }
        const myQuery = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
        if (myQuery.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of '${code}`, 404);
        }
        return res.send({ company: myQuery.rows[0] })
    } catch (e) {
        return next(e);
    }
})


/**
 * Deletes company. Should return 404 if company cannot be found.
 * Returns `{status: "deleted"}`
 */
router.delete('/:code', async (req, res, next) => {
    try {
        const myQuery = await db.query(`DELETE FROM companies WHERE code = $1`, [req.params.code]);

        if (myQuery.rowCount === 0) {
            throw new ExpressError(`There is no companies with code of '${req.params.code}`, 404);
        }

        return res.send({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
})


module.exports = router;