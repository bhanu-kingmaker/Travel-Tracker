
import express from "express";
import bodyParser from "body-parser";
import pkg from 'pg';
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = process.env.PORT || 5500;

const { Pool } = pkg;
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // for Neon
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


async function checkVisited(){
  const result = await db.query("SELECT country_code FROM visited_countries");
console.log(result.rows);
  let countries =[];
  result.rows.forEach((country)=>{
    countries.push(country.country_code);
  })
  return countries;
}

app.get("/", async (req, res) => {
 const countries = await checkVisited();
 res.render('index.ejs',{'total':countries.length,'countries':countries });
});

app.post('/add', async(req,res)=>{
  const input = req.body['country'];

  try{
  const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%'||$1||'%'",[input.toLowerCase()]);
    //res.render('index.ejs',{error:error});
  const countryCode = result.rows[0].country_code;

  try{


  await db.query('INSERT INTO visited_countries (country_code) VALUES($1)',[countryCode]);
  res.redirect('/');


  }catch(err){
    console.log(err);
    const countries = await checkVisited();
    res.render('index.ejs',{
    countries:countries,
    total:countries.length,
    error: 'Country has been added try again'
    });
  }
  }catch(err){
    console.log(err);
    const countries = await checkVisited();
    res.render('index.ejs',{
      countries:countries,
      total:countries.length,
      error: 'No country is founded with this Name'
    });
  }
});


app.get('/visited', async (req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");
    const visited = result.rows.map(row => row.country_code);
    res.json(visited);
  } catch (err) {
    console.error('Error fetching visited countries:', err);
    res.status(500).json({ error: 'Failed to fetch visited countries' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
