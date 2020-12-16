// Add packages
require("dotenv").config();
const multer = require("multer");
const upload = multer();
const dblib = require("./dblib.js");
const express = require("express");
const app = express();

// Add database package and connection string
const { Pool } = require('pg');
const { render } = require("ejs");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
      rejectUnauthorized: false
  }
});

// Add middleware to parse default urlencoded form
app.use(express.urlencoded({ extended: false }));

// Setup EJS
app.set("view engine", "ejs");

// Enable CORS (see https://enable-cors.org/server_expressjs.html)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// Application folders
app.use(express.static("public"));
app.use(express.static("views"));

// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Setup routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/sum", (req, res) => {
    
    res.render("sum", {
        type: "GET"
    });
});

app.post("/sum", (req,res) => {
    if (req.body.secondnumber < req.body.firstnumber)
    {
        res.render("sum", {type: "POST", msg: "Ending number must be greater than starting number", trans: "fail"})
    }
    else
    {
        result = dblib.calculateSum(parseInt(req.body.firstnumber), parseInt(req.body.secondnumber), parseInt(req.body.increment))
        res.render("sum", {type: "POST", msg: `The sum of the numbers from ${req.body.firstnumber} to ${req.body.secondnumber} incremented by ${req.body.increment} is: `, answer: result, trans: "success"})
    }

})

app.get("/import", async (req, res) => {
    totRecs = await dblib.getTotalRecords();
    res.render("import", {totRecs: totRecs.totRecords});
 });
 
//POST Input
app.post("/import",  upload.single('filename'), async (req, res) => {
     if(!req.file || Object.keys(req.file).length === 0) {
         message = "Error: Import file not uploaded";
         return res.send(message);
     };
     //Read file line by line, inserting records
     totRecs = await dblib.getTotalRecords();
     const buffer = req.file.buffer; 
     const lines = buffer.toString().split(/\r?\n/);
     books=[];     

     lines.forEach(line => {
          //console.log(line);
          book = line.split(",");
          //console.log(customer);
          books.push(book);
     });
     
     numInserted=0;
     numFailed=0;
     errorMessage="";

     for (book of books)
     {
         if (book[0] === 'Null')
         {
             book[0] = undefined;
         }
         if (book[1] === 'Null')
         {
             book[1] = undefined;
         }
         if (book[2] === 'Null')
         {
             book[2] = undefined;
         }
         if (book[3] === 'Null')
         {
             book[3] = undefined;
         }
         if (book[4] === 'Null')
         {
             book[4] = undefined;
         }
         if (book[5] === 'Null')
         {
             book[5] = undefined;
         }
     }
     (async () => {
        for (book of books) {
            const result = await dblib.insertProduct(book);
            if (result.trans === "success") {
                numInserted++;
            } else {
                numFailed++;
                errorMessage += `${result.msg} <br>`;
            };
        };    
        res.send({numberInserted: numInserted, numberFailed: numFailed, msg: errorMessage, totRecs: totRecs.totRecords});
    })()
    
 });