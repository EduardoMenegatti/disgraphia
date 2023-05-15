const fs = require("fs");
const data = require("../data.json");
const { age, date } = require("../utils");

exports.index = function (req, res) {
  return res.render("exams/index", { exams: data.exams });
};
exports.create = function (req, res) {
  return res.render("exams/create");
};
exports.post = function (req, res) {
  const keys = Object.keys(req.body);

  for (key of keys) {
    if (req.body[key] == "") {
      return res.send("Please, fill all fields!");
    }
  }

  let { avatar_url, birth, name, gender, services } = req.body;

  birth = Date.parse(birth);
  const create_at = Date.now();
  const id = Number(data.exams.length + 1);

  data.exams.push({
    id,
    avatar_url,
    name,
    birth,
    gender,
    services,
    create_at,
  });

  fs.writeFile("data.json", JSON.stringify(data, null, 2), function (err) {
    if (err) return res.send("Write file error");

    return res.redirect("/exams");
  });
};
exports.show = function (req, res) {
  const { id } = req.params;

  const foundexam = data.exams.find(function (exam) {
    return exam.id == id;
  });

  if (!foundexam) {
    return res.send("exam not found!");
  }

  const exam = {
    ...foundexam,
    age: age(foundexam.birth),
    create_at: new Intl.DateTimeFormat("pt-BR").format(foundexam.create_at),
  };

  return res.render("exams/show", { exam });
};
exports.edit = function (req, res) {
  const { id } = req.params;

  const foundexam = data.exams.find(function (exam) {
    return id == exam.id;
  });

  if (!foundexam) {
    return res.send("exam not found!");
  }

  const exam = {
    ...foundexam,
    birth: date(foundexam.birth).iso,
  };

  return res.render("exams/edit", { exam });
};
exports.test = function (req, res) {
  const { id } = req.params;

  const foundexam = data.exams.find(function (exam) {
    return id == exam.id;
  });

  if (!foundexam) {
    return res.send("exam not found!");
  }

  const exam = {
    ...foundexam,
    birth: date(foundexam.birth).iso,
  };

  return res.render("exams/test", { exam });
};
exports.put = function (req, res) {
  const { id } = req.body;

  let index = 0;

  const foundexam = data.exams.find(function (exam, foundIndex) {
    if (id == exam.id) {
      index = foundIndex;
      return true;
    }
  });

  if (!foundexam) return res.send("examnot found!");

  const exam = {
    ...foundexam,
    ...req.body,
    birth: Date.parse(req.body.birth),
    id: Number(req.body.id),
  };

  data.exams[index] = exam;

  fs.writeFile("data.json", JSON.stringify(data, null, 2), function (err) {
    if (err) return res.send("Write error!");

    return res.redirect(`/exams/${id}`);
  });
};
exports.delete = function (req, res) {
  const { id } = req.body;
  const filteredexams = data.exams.filter(function (exam) {
    return exam.id != id;
  });
  data.exams = filteredexams;

  fs.writeFile("data.json", JSON.stringify(data, null, 2), function (err) {
    if (err) return res.send("Delete file error!");

    return res.redirect("/exams");
  });
};
