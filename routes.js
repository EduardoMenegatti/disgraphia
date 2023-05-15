const express = require("express");
const routes = express.Router();
const exams = require("./controllers/exams");
const members = require("./controllers/members");

routes.get("/", function (req, res) {
  return res.redirect("/exams");
});

routes.get("/exams", exams.index);
routes.get("/exams/create", exams.create);
routes.get("/exams/:id", exams.show);
routes.get("/exams/:id/edit", exams.edit);
routes.get("/exams/:id/test", exams.test);
routes.post("/exams", exams.post);
routes.put("/exams", exams.put);
routes.delete("/exams", exams.delete);

routes.get("/members", members.index);
routes.get("/members/create", members.create);
routes.get("/members/:id", members.show);
routes.get("/members/:id/edit", members.edit);
routes.post("/members", members.post);
routes.put("/members", members.put);
routes.delete("/members", members.delete);

module.exports = routes;
