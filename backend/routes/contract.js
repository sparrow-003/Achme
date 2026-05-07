const express = require("express");
const router = express.Router();
const db = require("../config/database");

/* CREATE ESTIMATE */
router.post("/new", (req, res) => {
  const {
    client_company,
    template_names,
    contract_title,
    start_date,
    end_date,
    amount_value,
    category
    
  } = req.body;

  if (!client_company || !template_names || !contract_title || !start_date || !end_date || !amount_value || !category) {
    return res.status(400).json({ message: "project required" });
  }

  const sql = `
    INSERT INTO contracts
    (client_company, template_names, contract_title, start_date, end_date, amount_value, category)
    VALUES (?,?,?,?,?,?,?)
  `;

  db.query(
    sql,
    [client_company, template_names, contract_title, start_date, end_date, amount_value, category],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Insert failed" });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
});

/* FETCH */
router.get("/", (req, res) => {
  db.query("SELECT * FROM contracts ORDER BY id ASC", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* UPDATE */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    client_company,
    template_names,
    contract_title,
    start_date,
    end_date,
    amount_value,
    category,
  } = req.body;

  db.query(
    `UPDATE contracts SET
      client_company=?,
      template_names=?,
      contract_title=?,
      start_date=?,
      end_date=?,
      amount_value=?,
      category=?
     WHERE id=?`,
    [client_company, template_names, contract_title, start_date, end_date,amount_value, category, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Updated" });
    }
  );
});

/* DELETE */
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM contracts WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted" });
  });
});

module.exports = router;
