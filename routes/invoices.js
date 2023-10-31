const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

/**
 * Return info on invoices: like {invoices: [{id, comp_code}, ...]}
 */
router.get('/', async (req, res, next) => {
    try {
        const iQuery = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({ invoices: iQuery.rows });
    } catch (e) {
        return next(e);
    }
});

/**
 * Returns obj on given invoice. If invoice cannot be found, returns 404. 
 * Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
 */
router.get('/:id', async (req, res, next) => {
    try {
        const iQuery = await db.query(`
        SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description
        FROM invoices AS i
        INNER JOIN companies AS c ON i.comp_code = c.code
        WHERE id = $1`, [req.params.id]);

        if (iQuery.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with '${req.params.id}`, 404);
        }
        const data = iQuery.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.code, 
                name: data.name, 
                description: data.description,
            },
            amt: data.amt, 
            paid: data.paid, 
            add_date: data.add_date, 
            paid_date: data.paid_date,
        };
        return res.json({ "invoice": invoice });
    } catch (e) {
        return next(e);
    }
});


/**
 * Adds an invoice. Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        if (comp_code == null || amt == null) {
            throw new ExpressError('comp_code and amt are required', 404);
        }
        const iQuery = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt]);
        return res.status(201).json({ "invoice": iQuery.rows[0] })
    } catch (e) {
        return next(e);
    }
})



/**
 * Updates an invoice. If invoice cannot be found, returns a 404.
 * Needs to be passed in a JSON body of {amt} 
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        let paidDate = null;
        const iQuery = await db.query(`SELECT paid_date FROM invoices WHERE id = $1`, [id]);

        if (iQuery.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of '${id}`, 404);
        }
        if (amt === null) {
            throw new ExpressError('amt is required ', 404);
        }

        const paidDateInvoice = iQuery.rows[0].paid_date;

        if (!paidDateInvoice && paid) {
            paidDate = new Date();
        } else if(!paid) {
            paidDate = null;
        }
        else {
            paidDate = paidDateInvoice;
        }

        const myQuery = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 
                                        WHERE id=$4 
                                        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paidDate, id])

        return res.send({ invoice: myQuery.rows[0] })
    } catch (e) {
        return next(e);
    }
})



/**
 * Deletes an invoice. If invoice cannot be found, returns a 404. 
 * Returns: {status: "deleted"}
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const iQuery = await db.query(`DELETE FROM invoices WHERE id = $1`, [req.params.id]);

        if (iQuery.rowCount === 0) {
            throw new ExpressError(`There is no invoice with '${req.params.code}`, 404);
        }
        return res.send({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
})

module.exports = router;