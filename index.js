const dotenv = require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const mustache = require("mustache");
const app = express();
const port = process.env.PORT != undefined ? process.env.PORT : 8080;
const sqlite3 = require("sqlite3").verbose();
const cookieParser = require("cookie-parser");
const bowser = require("bowser");
const async = require("async");
const dayjs = require('dayjs');
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)
const renderFile = function(path, data, cb) {
  fs.readFile(path, (err, buff) => {
    // if any error
    if (err) {
      console.log(err);
      return;
    } else {
      //console.log(buff);
      let text = buff.toString();
      //console.log(text);
      cb(mustache.render(text, data));
    }
  });
};

const loadHome = (res) => {
  let params = {};
  async.waterfall(
    [
      function linkCount(cb) {
        db.all("SELECT COUNT (id) FROM links;", (err, rows) => {
          if (err) console.log(err);
          if (rows[0][`COUNT (id)`] > 0) {
            params.links = rows[0][`COUNT (id)`];
            //console.log(rows[0][`COUNT (id)`], "Bigger than 0")
            cb();
          } else {
            params.missingInfo = true;
            cb()
          }
        });
      },
      function refCount(cb) {
        if (!params.missingInfo) {
          db.all("SELECT COUNT (id) FROM refs;", (err, rows) => {
            if (err) console.log(err);
            if (rows[0][`COUNT (id)`]) {
              params.total_refs = rows[0][`COUNT (id)`];
              params.per_link = (params.total_refs / params.links).toFixed(2);

              cb();
            } else {
              params.missingInfo = true;
              cb()
            }
          });
        } else {
          cb();
        }
      },
      function osCount(cb) {
        if (!params.missingInfo) {

          db.all(
            'SELECT os_name||" "||versionName, COUNT(*) as a FROM refs GROUP BY os_name||" "||versionName ORDER BY a DESC;',
            (err, rows) => {
              if (err) console.log(err);
              params.oses = rows;
              cb();
            }
          );
        } else {
          cb();
        }
      },
      function platType(cb) {
        if (!params.missingInfo) {

          db.all(
            "SELECT platType, COUNT(*) as a FROM refs GROUP BY platType ORDER BY a DESC;",
            (err, rows) => {
              if (err) console.log(err);
              //console.log(rows);
              params.mostUsedPlat = rows[0].platType;
              params.mostPlatFract = rows[0].a;
              cb();
            }
          );
        } else {
          cb();
        }
      },
      function popLink(cb) {
        if (!params.missingInfo) {

          db.all(
            "SELECT token, COUNT(*) as a FROM refs LEFT JOIN links ON refs.link_id=links.id GROUP BY platType ORDER BY a DESC;",
            (err, rows) => {
              if (err) console.log(err);
              //console.log(rows);
              params.popLink = rows[0];
              cb();
            }
          );
        } else {
          cb();
        }
      },
      function popLang(cb) {
        if (!params.missingInfo) {

          db.all(
            "SELECT lang, COUNT(*) as a FROM refs GROUP BY lang ORDER BY a DESC;",
            (err, rows) => {
              if (err) console.log(err);
              //console.log(rows);
              params.popLang = rows[0];
              cb();
            }
          );
        } else {
          cb();
        }
      },
      function lastRefs(cb) {
        if (!params.missingInfo) {
          db.all(
            `SELECT * FROM links LEFT JOIN  refs ON refs.link_id = links.id ORDER BY timeHit DESC LIMIT 5;`,
            [],
            (err, rows) => {
              if (err) console.error(err);
              params.lastRefs = rows;
              cb()
            })
        } else {
          cb()
        }
      },
      function addfract(cb) {
        if (!params.missingInfo) {

          params.fract = function() {
            return ((this.a / params.total_refs) * 100).toFixed(2);
          };
          cb();
        } else {
          cb();
        }
      },
      function addOk(cb) {
        params.ok = !params.missingInfo;
        cb()
      }
    ],
    function(error) {
      renderFile(path.join(__dirname, "/views/index.html"), params, (a) => {
        res.send(a);
      });
    }
  );
};
app.use(cookieParser());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
// open the database
var dberror = false;
let db = new sqlite3.Database("./db/db.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
    dberror = err.message;
  }
  console.log("Connected to the database.");
});
// page delivery
app.all("/", (req, res, next) => {
  if (dberror) {
    let signedin = (req.cookies.pwd && req.cookies.pwd === process.env.pwd);
    renderFile(`${__dirname}/views/dberror.html`, {
      signedin: signedin,
      error: (signedin ? dberror : "")
    }, (data) => {
      res.send(data);
    });
  } else {
    next();
  }
})
app.get("/", function(req, res) {
  if (req.cookies.pwd && req.cookies.pwd === process.env.pwd) {
    if (req.query.page) {
      if (req.query.page == "add") {
        res.sendFile(path.join(__dirname, "/views/add.html"));
      } else if (req.query.page == "ref") {
        if (req.query.id) {
          db.all(
            `SELECT * FROM refs LEFT JOIN links ON refs.link_id = links.id WHERE refs.id=?;`,
            [req.query.id],
            (err, rows) => {
              if (rows.length) { //refs exist
                if (err) return console.log(err); //abort if error
                let data1 = rows[0];
                let divertedrows = []

                for (i in data1) {
                  divertedrows.push({
                    key: i,
                    val: data1[i]
                  })
                }
                data1.divertedrows = divertedrows;
                data1.ua = bowser.parse(data1.full_ua);
                data1.timeHit = dayjs.unix(data1.timeHit).toNow(true);

                renderFile(`${__dirname}/views/refdetail.html`, data1, (data) => {
                  res.send(data)
                })
              } else { //404
                res.sendFile(`${__dirname}/views/404.html`);
              }
            }
          );
        } else {
          res.sendFile(path.join(__dirname, "/views/404.html"));
        }
      } else if (req.query.page == "detail") {
        if (req.query.token) {
          db.all(
            `SELECT * FROM links WHERE token=?`,
            [req.query.token],
            (err, rows) => {
              if (rows.length) { //link exist
                if (err) return console.log(err); //abort if error
                db.all(
                  `SELECT * FROM refs WHERE link_id=? ORDER BY timeHit DESC LIMIT 5;`,
                  [rows[0].id],
                  (err2, rows2) => {
                    db.get(
                      `SELECT COUNT(id) FROM refs WHERE link_id=?;`,
                      [rows[0].id],
                      (err3, rows3) => {
                        //console.log(rows3);

                        let data = {
                          basicData: rows[0],
                          token: req.query.token,
                          url: rows[0].url,
                          links: rows2,
                          count: rows3[`COUNT(id)`],

                          convDate: function() {
                            return dayjs.unix(this.timeHit).toNow(true);
                          },
                          platform: function() {
                            switch (this.platType) {
                              case "mobile":
                                return "Mobile";
                                break;
                              case "desktop":
                                return "Desktop";
                                break;
                              default:
                                return "Unknown";
                            }
                          },
                        };
                        data.basicData.created = dayjs.unix(data.basicData.created).toNow(true);;
                        renderFile(
                          "views/detail.html", data,
                          function(a) {
                            res.send(a);
                          }
                        );
                      }
                    );
                  }
                );
              } else { //404
                res.sendFile(`${__dirname}/views/404.html`);
              }
            }
          );
        } else {
          res.sendFile(path.join(__dirname, "/views/404.html"));
        }
      } else if (req.query.page == "allLinks") {
        db.all(
          `SELECT * FROM links ORDER BY created DESC LIMIT 250;`,
          [],
          (err, rows) => {
            if (err) console.log(err);
            //console.log(rows)
            renderFile(
              path.join(__dirname, "/views/alllinks.html"), {
                links: rows,
                convDate: function() {
                  return new Date(this.created * 1000);
                },
              },
              (a) => {
                res.send(a);
              }
            );
          }
        );
      } else if (req.query.page == "allRefs") {
        db.all(
          `SELECT * FROM links LEFT JOIN  refs ON refs.link_id = links.id ORDER BY timeHit DESC LIMIT 250;`,
          [],
          (err, rows) => {
            if (err) console.log(err);
            renderFile(
              path.join(__dirname, "/views/allrefs.html"), {
                links: rows,
                convDate: function() {
                  return dayjs.unix(this.timeHit).toNow(true);
                },
              },
              (a) => {
                res.send(a);
              }
            );
          }
        );
      } else if (req.query.page == "logout") {
        res.clearCookie("pwd");
        res.redirect("/");
      } else if (req.query.page == "search") {
        if (req.query.q) {
          let options = {
            title: req.query.q,
            opt: req.query.opt,
            isref: req.query.opt == "refs",
            islink: req.query.opt == "link" || req.query.opt == "" || !req.query.opt,
          };
          async.waterfall([function getResFromDB(cb) {
            db.all(
              `SELECT * FROM links WHERE token LIKE "%"||?||"%";`,
              [req.query.q],
              (err, rows) => {
                if (err) console.log(err);
                options.rows = rows;
                cb();
              })

          }], function(error) {
            renderFile(
              path.join(__dirname, "/views/search.html"),
              options,
              (a) => {
                res.send(a);
              }
            );
          });
        } else {
          res.sendFile(`${__dirname}/views/404.html`);
        }
      } else {
        // ?page=blank
        loadHome(res);
      }
    } else {
      //no ?page
      loadHome(res);
    }
  } else {
    //unauthorized, refer to login
    res.sendFile(path.join(__dirname, "/views/login.html"));
  }
});
// api
app.post("/", function(req, res) {
  if (req.body.pwd && req.body.pwd == process.env.pwd) {
    res.cookie("pwd", req.body.pwd);
    res.redirect("/");
  } else if (req.body.context == "add") {
    if (req.cookies.pwd && req.cookies.pwd === process.env.pwd) {
      if (req.body.token && req.body.url) {
        db.run(
          `INSERT INTO links (token, url, created) VALUES(?, ?, ?)`,
          [
            req.body.token,
            req.body.url,
            Math.floor(new Date().getTime() / 1000),
          ],
          function(err) {
            if (err) {
              res.redirect("/");

              return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
            res.redirect("/?page=detail&token=" + encodeURIComponent(req.body.token));
            return;
          }
        );
      } else {
        res.redirect("/?page=add");
      }
    } else {
      res.redirect("/");
    }
  } else if (req.body.context == "delete") {
    if (req.cookies.pwd && req.cookies.pwd === process.env.pwd) {
      if (req.body.token) {
        db.all(
          `SELECT id FROM links WHERE token=?;`,
          [req.body.token],
          (err, rows) => {
            {
              if (err) {
                console.log(err);
                res.send("error");
                return;
              }
            }
            if (rows.length) {
              db.run("DELETE FROM links WHERE id=?; ", [rows[0].id], (err2, rows2) => {
                if (err) {
                  console.log(err2);
                  res.send("error");
                  return;
                };
                db.run("DELETE FROM refs WHERE link_id=?; ", [rows[0].id], (err2, rows2) => {
                  if (err) {
                    console.log(err2);
                    res.send("error");
                    return;
                  }
                  res.send("success")
                });
              })
            } else {
              res.send("Token not under use")
            }
          })
      } else {
        res.send("token missing")
      }
    } else {
      res.send("unauthorized")
    }
  } else if (req.body.context == "checkurl") {
    if (req.cookies.pwd && req.cookies.pwd === process.env.pwd) {
      if (req.body.token) {
        db.all(
          `SELECT url FROM links WHERE token=?;`,
          [req.body.token],
          (err, rows) => {
            if (err) console.log(err);

            res.send(JSON.stringify(rows))
          })

      } else {
        res.send("[]")
      }
    } else {
      res.send("unauthorized")
    }
  } else {
    res.redirect("/");
  }
});
// static file
app.use("/static", express.static(path.join(__dirname, "/static")));
//forwarding
app.get("/:id", function(req, res) {
  let id = req.params.id;
  db.all(`SELECT url, id FROM links WHERE token=?`, [id], (err, rows) => {
    //console.log(JSON.stringify(rows));
    if (rows.length && rows[0].url) {
      let Browser = bowser.parse(req.headers["user-agent"]);
      //console.log(Browser);
      db.run(
        `INSERT INTO refs (link_id, lang, browser_name, os_name, versionName, platType, referrer, full_ua, timeHit) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rows[0].id,
          req.headers["accept-language"],
          Browser.browser.name,
          Browser.os.name,
          Browser.os.versionName,
          Browser.platform.type,
          req.headers.referer,

          req.headers["user-agent"],
          Math.floor(new Date().getTime() / 1000),
        ],
        function(err) {
          if (err) {
            return console.log(err.message);
          }
          // get the last insert id
          //console.log(`A row has been inserted with rowid ${this.lastID}`);
          return;
        }
      );
      res.redirect(rows[0].url);
    } else {
      res.sendFile(path.join(__dirname, "/views/404notsignedin.html"));
    }
  });
});
app.use(function(req, res) {
  res.sendFile(`${__dirname}/views/404notsignedin.html`, 404);
});
app.listen(port, function(err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", port);
  fs.appendFile('./log.txt', 'Server restarted: '+dayjs().format()+' ('+dayjs().valueOf()+')\n' , function (err) {
  if (err) throw err;
  console.log('Restart Logged!');
});
});

process.on('SIGINT', () => {
  console.log("Closing db, server")
    db.close();
    app.close();
    console.log("Finished!")
});