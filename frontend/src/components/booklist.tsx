import { useEffect, useState } from "react";

function BookList() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/books")
      .then(res => res.json())
      .then(setBooks);
  }, []);

  return (
    <div>
      <h1>Library Catalog</h1>
      <div className="grid">
        {books.map((b: any) => (
          <a key={b.book_id} href={`/book/${b.book_id}`} className="card">
            <h2>{b.title}</h2>
            <p>{b.author}</p>
            <p>Status: {b.status}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

export default BookList;