/** DEVELOPMENT */
DROP DATABASE IF EXISTS biztime;
CREATE DATABASE biztime;

\c biztime

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS companies_industries;

CREATE TABLE companies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date DATE DEFAULT CURRENT_DATE NOT NULL,
    paid_date DATE,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
    code TEXT PRIMARY KEY,
    industry TEXT NOT NULL UNIQUE
);

CREATE TABLE companies_industries (
    company_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
    industry_code TEXT NOT NULL REFERENCES industries ON DELETE CASCADE,
    PRIMARY KEY(company_code, industry_code)
);

INSERT INTO companies VALUES 
    ('apple', 'Apple Computer', 'Maker of OSX.'),
    ('ibm', 'IBM', 'Big blue.'),
    ('american-express', 'American Express', 'Maker of OSX.'),
    ('dws', 'Deutsche Bank', 'Maker of OSX.');

INSERT INTO invoices (comp_Code, amt, paid, paid_date) VALUES 
    ('apple', 100, false, null),
    ('apple', 200, false, null),
    ('dws', 300, true, '2018-01-01'),
    ('ibm', 400, false, null);

INSERT INTO industries VALUES 
    ('acct', 'Accounting'),
    ('cp', 'Computer'),
    ('tlc', 'Telecommunications');

INSERT INTO companies_industries VALUES
    ('apple', 'cp'),
    ('ibm', 'cp'),
    ('ibm', 'tlc'),
    ('american-express', 'acct'),
    ('dws', 'acct');

/*
/** TEST */
DROP DATABASE IF EXISTS biztime_test;
CREATE DATABASE biztime_test;

\c biztime_test

DROP TABLE IF EXISTS companies_industries;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS industries;


CREATE TABLE companies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date DATE DEFAULT CURRENT_DATE NOT NULL,
    paid_date DATE,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
    code TEXT PRIMARY KEY,
    industry TEXT NOT NULL UNIQUE
);

CREATE TABLE companies_industries (
    company_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
    industry_code TEXT NOT NULL REFERENCES industries ON DELETE CASCADE,
    PRIMARY KEY(company_code, industry_code)
);
*/