const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  database: process.env.MYSQL_DB || 'myDB',
});

function renderPage(res, page, options = {}) {
  res.sendFile(path.join(__dirname, 'public', page));
}

app.get('/', (req, res) => renderPage(res, 'index.html'));
app.get('/about', (req, res) => renderPage(res, 'about.html'));
app.get('/product', (req, res) => renderPage(res, 'product.html'));
app.get('/contact', (req, res) => renderPage(res, 'contact.html'));
app.get('/register', (req, res) => renderPage(res, 'register.html'));
// COD NOU: API GET care returneaza userul dupa id
app.get('/api/users/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'ID-ul utilizatorului trebuie sa fie un numar pozitiv.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, age FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost gasit.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'A aparut o eroare la preluarea utilizatorului.' });
  }
});
// COD NOU: API DELETE care sterge userul dupa id
app.delete('/api/users/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'ID-ul utilizatorului trebuie sa fie un numar pozitiv.' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost gasit.' });
    }

    return res.json({ message: 'Utilizatorul a fost sters cu succes.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'A aparut o eroare la stergerea utilizatorului.' });
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password, age } = req.body;
  // COD NOU: luam valoarea din campul confirm-password
  const confirmPassword = req.body['confirm-password'];
  // COD NOU: convertim age la numar pentru validare
  const parsedAge = Number(age);

  // COD NOU: verificam sa fie completate toate campurile, inclusiv confirm-password
  if (!username || !email || !password || !confirmPassword || !age) {
    return res.status(400).send('Toate câmpurile sunt obligatorii.');
  }

  // COD NOU: verificam daca password si confirm-password sunt identice
  if (password !== confirmPassword) {
    return res.status(400).send('Parolele nu coincid.');
  }

  // COD NOU: verificam daca varsta este strict mai mare decat 18
  if (!Number.isFinite(parsedAge) || parsedAge <= 18) {
    return res.status(400).send('Varsta trebuie sa fie mai mare de 18.');
  }

  try {
    const connection = await pool.getConnection();
    try {
      // COD NOU: verificam daca exista deja un utilizator cu acelasi username si email
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ? AND email = ? LIMIT 1',
        [username, email]
      );

      // COD NOU: daca utilizatorul exista deja, oprim inregistrarea si afisam un mesaj
      if (existingUsers.length > 0) {
        connection.release();
        return res.status(409).send('Utilizatorul exista deja.');
      }

      await connection.execute(
        'INSERT INTO users (username, email, password, age) VALUES (?, ?, ?, ?)',
        [username, email, password, parsedAge]
      );
      connection.release();
      res.sendFile(path.join(__dirname, 'public', 'register-success.html'));
    } catch (err) {
      connection.release();
      console.error(err);
      res.status(500).send('A apărut o eroare la salvarea datelor.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Nu se poate conecta la baza de date.');
  }
});

app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});
