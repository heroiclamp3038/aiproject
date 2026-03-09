import { useEffect, useState } from "react";

function BookList() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/books")
      .then(res => res.json())
      .then(data => {
        console.log("BOOKS FROM BACKEND:", data);
        setBooks(data);
      })
      .catch(err => console.error("FETCH ERROR:", err));
  }, []);

  return (
    <div>
      <h1>Library Catalog</h1>

      {books.length === 0 && <p>No books found.</p>}

      <div className="grid">
        {books.map((b) => (
          <div key={b.book_id} className="card">
            <h2>{b.Title}</h2>
            <p>{b.Author}</p>
            <p>Status: {b.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookList;