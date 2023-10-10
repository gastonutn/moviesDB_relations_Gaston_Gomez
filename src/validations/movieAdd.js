const { check, body } = require("express-validator");

module.exports = [
  check("title")
    .notEmpty()
    .withMessage("Es obligatorio")
    .bail()
    .isLength({
      min: 4,
      max: 80,
    })
    .withMessage("Debe tener entre 4 y 20 caracteres"),
  check("rating")
    .notEmpty()
    .withMessage("Es requerido")
    .isDecimal()
    .withMessage("Debe ser numero positivo"),
    check("awards")
    .notEmpty()
    .withMessage("Es requerido")
    .isInt({
        gt: 1,
      }).withMessage("Debe ser numero positivo"),
  check("release_date")
    .notEmpty()
    .withMessage("Es obligatorio"),
  check("length").notEmpty()
  .withMessage("Es requerido")
  .isInt({
      gt: 1,
    }).withMessage("Debe ser numero positivo"),
    check("genre_id")
    .notEmpty()
    .withMessage("Es requerida"),
];
