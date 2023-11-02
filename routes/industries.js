const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

/**
 * Return info on industries: like { industries: {code, industry}, ...]}
 */
router.get('/', async (req, res, next) => {
    try {
        const iQuery = await db.query(`SELECT code, industry FROM industries`);
        return res.json({ industries: iQuery.rows });
    } catch (e) {
        return next(e);
    }
});

/**
 * Returns obj on given industry. If invoice cannot be found, returns 404. 
 * Returns { industry: {code, industry, company: [name ] }}
 */
router.get('/:code', async (req, res, next) => {
    try {
        const iQuery = await db.query(`
        SELECT i.code, i.industry, c.name
        FROM industries AS i
        LEFT JOIN companies_industries AS c_i ON c_i.industry_code = i.code 
        LEFT JOIN companies AS c ON c.code = c_i.company_code
        WHERE i.code = $1`, [req.params.code]);

        if (iQuery.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of '${req.params.code}`, 404);
        }
        const { code, industry } = iQuery.rows[0]; //this part is the same
        const companies = iQuery.rows.map(r => r.name);
        return res.json({ industry: { code, industry, companies } });
    } catch (e) {
        return next(e);
    }
});


/**
 * Adds an industries. Needs to be passed in JSON body of: {code, industry}
 * Returns: {industries: {code, industry}}
 */
router.post('/', async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        if (code == null || industry == null) {
            throw new ExpressError('code and industry are required', 404);
        }
        const iQuery = await db.query('INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry', [code, industry]);
        console.log(iQuery.rows[0]);
        return res.status(201).json({ "industry": iQuery.rows[0] })
    } catch (e) {
        return next(e);
    }
})



/**
 * Updates an industries. If industries cannot be found, returns a 404.
 * Needs to be passed in a JSON body of {industry} 
 * Returns: {industry: {code, industry }}
 */
router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { industry } = req.body;
        const iQuery = await db.query(`UPDATE industries SET industry=$1
                                        WHERE code=$2 
                                        RETURNING code, industry`, [industry, code])
        if (iQuery.rows.length === 0) {
            throw new ExpressError(`Can't find industry with code '${code}`, 404);
        }
        return res.send({ industry: iQuery.rows[0] })
    } catch (e) {
        return next(e);
    }
})


/**
 * Adds an industries. Needs to be passed in JSON body of: {industry code, company code}
 * Returns: {companies_industries: {company_code, industry_code}}
 */
router.post('/associating/', async (req, res, next) => {
    try {
        const { code_C, code_I } = req.body;
        if (code_C == null || code_I == null) {
            throw new ExpressError('industry code and company code are required', 404);
        }
        const iQuery = await db.query('INSERT INTO companies_industries (company_code, industry_code) VALUES ($1, $2) RETURNING company_code, industry_code', [code_C, code_I]);
        console.log(iQuery.rows[0]);
        return res.status(201).json({ "companies_industries": iQuery.rows[0] })
    } catch (e) {
        return next(e);
    }
})


module.exports = router;